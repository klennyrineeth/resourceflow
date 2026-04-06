import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import StatusBadge from '../components/UI/StatusBadge';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { Search, Plus, Package, AlertCircle, Loader2, UserPlus, X, CheckCircle2, Trash2, Edit, Eye } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical';
  category: string;
  assignedTo?: string;
  assignedToId?: string;
}

interface Personnel {
  id: string;
  name: string;
  specialty: string;
  currentAssignment?: string;
  assignedToNeeder?: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]); // NEW: Track every single assignment independently
  const [loading, setLoading] = useState(true);
  const [assigningResource, setAssigningResource] = useState<Resource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDataLogOpen, setIsDataLogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Resource Form
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState(0);
  const [newUnit, setNewUnit] = useState('units');
  const [newCategory, setNewCategory] = useState('General');

  useEffect(() => {
    // Seed and Listen to Resources
    const seedResources = async () => {
      const snap = await getDocs(collection(db, 'resources'));
      if (snap.empty) {
        const initial = [
          { name: 'Medical Supplies', quantity: 450, unit: 'units', status: 'sufficient', category: 'Medical' },
          { name: 'Food Packages', quantity: 1200, unit: 'packages', status: 'sufficient', category: 'Food' },
          { name: 'Water Bottles', quantity: 3500, unit: 'bottles', status: 'sufficient', category: 'Water' },
          { name: 'Blankets', quantity: 85, unit: 'items', status: 'low', category: 'Shelter' }
        ];
        for (const r of initial) { await addDoc(collection(db, 'resources'), { ...r, createdAt: serverTimestamp() }); }
      }
    };
    seedResources();

    const unsubscribeRes = onSnapshot(collection(db, 'resources'), (snapshot) => {
      setResources(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[]);
      setLoading(false);
    });

    // Listen to Personnel
    const unsubscribePers = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      setPersonnel(
        snapshot.docs
          .filter(d => d.data().status === 'inactive' || d.data().assignmentId)
          .map(d => ({ 
            id: d.id, 
            name: d.data().name, 
            specialty: d.data().specialty || 'General Responder',
            currentAssignment: d.data().currentAssignment || 'Active Relief Mission',
            assignedToNeeder: d.data().assignedToNeeder
          }))
      );
    });

    // Listen to ALL Allocation Records (for the Log)
    const unsubscribeAlloc = onSnapshot(collection(db, 'allocations'), (snapshot) => {
       setAllocations(snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toLocaleString() || 'Just now'
       })));
    });

    return () => { unsubscribeRes(); unsubscribePers(); unsubscribeAlloc(); };
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const editingId = (window as any)._editingResourceId;
      const data = {
        name: newName,
        quantity: newQuantity,
        unit: newUnit,
        category: newCategory,
        status: newQuantity > 100 ? 'sufficient' : newQuantity > 0 ? 'low' : 'critical',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'resources', editingId), data);
        (window as any)._editingResourceId = null;
      } else {
        await addDoc(collection(db, 'resources'), { ...data, createdAt: serverTimestamp() });
      }

      setIsAddModalOpen(false);
      setNewName('');
      setNewQuantity(0);
    } catch (err) { alert(err); }
    finally { setSubmitting(false); }
  };

  const handleAssignToPersonnel = async (p: Personnel) => {
    if (!assigningResource) return;
    setSubmitting(true);
    try {
      // NEW: Create a SEPARATE record for this assignment
      await addDoc(collection(db, 'allocations'), {
        resourceId: assigningResource.id,
        resourceName: assigningResource.name,
        category: assigningResource.category,
        responderName: p.name,
        responderId: p.id,
        neederName: p.assignedToNeeder || 'Field Mission',
        createdAt: serverTimestamp()
      });
      
      setAssigningResource(null);
      alert(`${assigningResource.name} successfully assigned to ${p.name}`);
    } catch (err) { alert(err); }
    finally { setSubmitting(false); }
  };

  const handleReleaseResource = async (allocId: string) => {
     try {
        // Delete the SPECIFIC allocation record
        await deleteDoc(doc(db, 'allocations', allocId));
     } catch (err) { alert(err); }
  };


  const handleDeleteResource = async (rid: string) => {
    if (window.confirm('Erase this resource from inventory permanently?')) {
      try {
        await deleteDoc(doc(db, 'resources', rid));
      } catch (err) { alert(err); }
    }
  };

  const openEditModal = (r: Resource) => {
    setNewName(r.name);
    setNewQuantity(r.quantity);
    setNewUnit(r.unit);
    setNewCategory(r.category);
    // Use a hidden ID state to know we are editing
    (window as any)._editingResourceId = r.id; 
    setIsAddModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-32">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 text-left gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Resource Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">Manage relief supplies and allocate them to authorized responders.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={() => setIsDataLogOpen(true)} className="flex-1 sm:flex-initial h-11 px-6 rounded-lg font-bold border-gray-200">
                 <Eye className="w-4 h-4 mr-2" />
                 View Log
              </Button>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-initial h-11 px-6 rounded-lg font-bold shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
           <Card className="p-5 sm:p-6 border-gray-100 shadow-sm flex items-center justify-between bg-white text-left">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Stock</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{resources.reduce((acc, r) => acc + r.quantity, 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package className="w-5 sm:w-6 h-5 sm:h-6" /></div>
           </Card>
           <Card className="p-5 sm:p-6 border-gray-100 shadow-sm flex items-center justify-between bg-white text-left">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Low Stock Items</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600">{resources.filter(r => r.status !== 'sufficient').length}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle className="w-5 sm:w-6 h-5 sm:h-6" /></div>
           </Card>
           <Card className="p-5 sm:p-6 border-gray-100 shadow-sm flex items-center justify-between bg-white text-left">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Allocations</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{allocations.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><UserPlus className="w-5 sm:w-6 h-5 sm:h-6" /></div>
           </Card>
        </div>

        {/* INVENTORY LIST */}
        <section className="text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-100 gap-4">
            <h2 className="text-lg font-bold text-gray-800">Supply Catalog</h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                placeholder="Filter inventory..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-gray-50 border-0 rounded-lg outline-none text-sm font-medium" 
              />
            </div>
          </div>

          {loading ? (
             <div className="flex items-center justify-center p-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mr-3" /><span>Accessing inventory...</span></div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resources
                  .filter(r => 
                    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    r.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(r => (
                  <Card key={r.id} className="p-6 border-gray-100 hover:border-blue-200 transition-all rounded-2xl bg-white shadow-sm flex flex-col relative group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-400 group-hover:text-blue-600 transition-colors">
                           <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <StatusBadge status={r.status} />
                           {/* Hover Actions - Spaced out better now */}
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                              <button onClick={() => openEditModal(r)} className="p-1.5 bg-blue-50/50 hover:bg-blue-100/80 text-blue-600 rounded-md transition-all shadow-sm border border-blue-200/50"><Edit className="w-3 h-3"/></button>
                              <button onClick={() => handleDeleteResource(r.id)} className="p-1.5 bg-red-50/50 hover:bg-red-100/80 text-red-600 rounded-md transition-all shadow-sm border border-red-200/50"><Trash2 className="w-3 h-3"/></button>
                           </div>
                        </div>
                     </div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{r.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.category}</p>
                    
                    <div className="mt-6 mb-6">
                       <p className="text-2xl font-black text-gray-900">{r.quantity.toLocaleString()}</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{r.unit}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50">
                        <Button variant="secondary" className="w-full h-9 rounded-lg text-xs font-bold" onClick={() => setAssigningResource(r)}>
                           {allocations.some(a => a.resourceId === r.id) ? 'Allocate More' : 'Assign to Responder'}
                        </Button>
                    </div>
                  </Card>
                ))}
             </div>
          )}
        </section>

        {/* ASSIGN RESOURCE MODAL */}
        {assigningResource && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setAssigningResource(null)} />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                 <div className="p-6 bg-gray-50 flex justify-between items-center text-left">
                    <h3 className="text-lg font-bold text-gray-900">Allocate {assigningResource.name}</h3>
                    <button onClick={() => setAssigningResource(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400"/></button>
                 </div>
                 <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto text-left">
                    {personnel.length === 0 ? (
                       <p className="text-gray-400 p-8 text-center font-medium">No personnel detected in the system.</p>
                    ) : (
                       personnel.map(p => (
                          <div key={p.id} onClick={() => handleAssignToPersonnel(p)} className="p-4 bg-white border border-gray-100 hover:border-blue-500 rounded-xl cursor-pointer transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">{p.name[0]}</div>
                                <div>
                                   <p className="text-sm font-bold text-gray-900 leading-none mb-1.5">{p.name}</p>
                                   <div className="flex flex-col gap-1">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{p.specialty}</p>
                                      
                                      <div className="flex items-center gap-1.5 flex-wrap bg-blue-50/50 px-2 py-1 rounded-md mt-1 border border-blue-100/30">
                                         <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">
                                            Mission: {p.currentAssignment}
                                         </p>
                                         {p.assignedToNeeder && (
                                            <>
                                               <span className="w-1 h-1 bg-blue-300 rounded-full" />
                                               <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                                                  Helping: {p.assignedToNeeder}
                                               </p>
                                            </>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             </div>
                             <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* ADD STOCK MODAL */}
        {isAddModalOpen && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
              <form onSubmit={handleAddResource} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl text-left animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-bold text-gray-900">Add Stock Entry</h3>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
                 </div>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Name</label>
                       <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border-0 rounded-lg outline-none font-medium text-sm" placeholder="e.g. Hygiene Kits..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
                          <input required type="number" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="w-full h-11 px-4 bg-gray-50 border-0 rounded-lg outline-none font-medium text-sm" />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit</label>
                          <input required value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border-0 rounded-lg outline-none font-medium text-sm" placeholder="kits/units..." />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Classification</label>
                       <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border-0 rounded-lg outline-none font-medium text-sm">
                          <option>Medical</option>
                          <option>Food</option>
                          <option>Water</option>
                          <option>Shelter</option>
                          <option>Hygiene</option>
                          <option>Logistics</option>
                       </select>
                    </div>
                 </div>
                 <div className="mt-10 flex gap-4">
                    <Button type="button" variant="secondary" className="flex-1 rounded-lg" onClick={() => setIsAddModalOpen(false)}>Abort</Button>
                    <Button type="submit" variant="primary" className="flex-1 rounded-lg shadow-sm" disabled={submitting}>
                       {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Stock'}
                    </Button>
                 </div>
              </form>
           </div>
        )}

        {/* ALLOCATION LOG MODAL (VIEW DATA) */}
        {isDataLogOpen && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsDataLogOpen(false)} />
              <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                 <div className="p-6 border-b bg-gray-50 flex justify-between items-center text-left">
                    <div>
                       <h3 className="text-xl font-black text-gray-900 tracking-tight">Deployment Intelligence Log</h3>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Active Mission Allocations</p>
                    </div>
                    <button onClick={() => setIsDataLogOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors border-0"><X className="w-6 h-6 text-gray-400"/></button>
                 </div>
                 
                 {/* DESKTOP TABLE */}
                 <div className="hidden md:block overflow-x-auto flex-1 text-left">
                    {allocations.length === 0 ? (
                       <div className="p-20 text-center text-gray-400 italic font-medium">No active mission allocations detected.</div>
                    ) : (
                       <table className="w-full">
                          <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                             <tr>
                                <th className="px-6 py-4">Supply Item</th>
                                <th className="px-6 py-4">Responder</th>
                                <th className="px-6 py-4">Target Needer</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-center">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {allocations.map((alloc) => (
                                <tr key={alloc.id} className="hover:bg-blue-50/20 transition-colors">
                                   <td className="px-6 py-4">
                                      <div className="text-sm font-bold text-gray-900">{alloc.resourceName}</div>
                                      <div className="text-[9px] text-blue-500 font-bold uppercase">{alloc.category}</div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                         <div className="w-7 h-7 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">{alloc.responderName?.[0]}</div>
                                         <span className="text-sm font-bold text-gray-800">{alloc.responderName}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                         <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                                         <span className="text-sm font-bold text-gray-700">{alloc.neederName}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{alloc.createdAt}</td>
                                   <td className="px-6 py-4 text-center">
                                      <button 
                                         onClick={() => handleReleaseResource(alloc.id)}
                                         className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-lg hover:bg-red-100 transition-all active:scale-95"
                                      >
                                         Release Item
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    )}
                 </div>

                 {/* MOBILE CARD LIST */}
                 <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {allocations.length === 0 ? (
                       <div className="py-12 text-center text-gray-400 italic font-medium">No active missions.</div>
                    ) : (
                       allocations.map((alloc) => (
                          <div key={alloc.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                             <div className="flex justify-between items-start">
                                <div>
                                   <h4 className="font-bold text-gray-900 text-base">{alloc.resourceName}</h4>
                                   <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">{alloc.category}</p>
                                </div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{alloc.createdAt.split(',')[0]}</div>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                   <p className="text-[8px] font-bold text-blue-400 uppercase mb-1">To Personnel</p>
                                   <p className="text-[11px] font-black text-gray-700 truncate">{alloc.responderName}</p>
                                </div>
                                <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                   <p className="text-[8px] font-bold text-emerald-400 uppercase mb-1">For Needer</p>
                                   <p className="text-[11px] font-black text-gray-700 truncate">{alloc.neederName}</p>
                                </div>
                             </div>
                             <button 
                                onClick={() => handleReleaseResource(alloc.id)}
                                className="w-full py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100/50"
                             >
                                Release to Stock
                             </button>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        )}

      </div>
    </DashboardLayout>
  );
}
