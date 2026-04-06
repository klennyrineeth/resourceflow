import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import { Search, Clock, MapPin, Eye, Trash2, X, AlertTriangle, Plus, Loader2, UserCheck, CheckCircle2, Mail, UserMinus, UserPlus } from 'lucide-react';
import Button from '../components/UI/Button';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';


export default function Requests() {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [availableVolunteers, setAvailableVolunteers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRequest, setViewingRequest] = useState<any>(null);
  const [assigningTo, setAssigningTo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Request Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Medical / First Aid');
  const [customType, setCustomType] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newUrgency, setNewUrgency] = useState('medium');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    // Listen to Requests
    const colRef = collection(db, 'requests');
    const unsubscribeReqs = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(docRef => {
        const data = docRef.data();
        let displayTime = 'Just now';
        
        try {
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            displayTime = date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {}

        return {
          id: docRef.id,
          displayId: docRef.id.substring(0, 8).toUpperCase(),
           requesterName: data.requesterName || 'Anonymous',
          requesterEmail: data.requesterEmail || 'Not provided',
          requesterPhone: data.requesterPhone || 'Not provided',
          type: data.type || 'General Relief',
          location: data.location || 'Unknown Area',
          status: (data.status || data.urgency || 'pending').toLowerCase(),
          assignedTo: data.assignedTo || 'Unassigned',
          created: displayTime,
          description: data.description || 'No description provided.',
          timestamp: data.createdAt?.seconds || 0
        };
      });


      docs.sort((a, b) => b.timestamp - a.timestamp);
      setRequests(docs);
      setIsLoading(false);
    });

    // Listen to Active Volunteers
    const qVols = query(collection(db, 'volunteers'), where('status', '==', 'active'));
    const unsubscribeVols = onSnapshot(qVols, (snapshot) => {
      setAvailableVolunteers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribeReqs(); unsubscribeVols(); };
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation || !newDescription) return;
    setSubmitting(true);
    try {
      const finalType = isOther ? customType : newType;
      
      let lat = null;
      let lng = null;

      // Real-time Geocoding for admin manually entered addresses (Tactical Sync)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation + ', India')}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch (locErr) {
        console.warn("Manual geocoding failed, falling back to tactical defaults.");
      }

      await addDoc(collection(db, 'requests'), {
        requesterName: newName,
        requesterEmail: newEmail,
        requesterPhone: newPhone,
        type: finalType,
        location: newLocation,
        lat: lat,
        lng: lng,
        urgency: newUrgency,
        description: newDescription,
        status: 'pending',
        assignedTo: 'Unassigned',
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setCustomType('');
      setIsOther(false);
      setNewLocation('');
      setNewDescription('');
    } catch (err) { alert('Error: ' + (err as any).message); }
    finally { setSubmitting(false); }
  };

  const sendEmailNotification = async (volunteer: any, request: any) => {
    const templateParams = {
      to_name: volunteer.name,
      to_email: volunteer.email,
      email: volunteer.email, // Final Check: Send to the volunteer
      volunteer_email: volunteer.email,
      from_name: "ResourceFlow HQ", 
      hq_email: userProfile?.email || "resourceflow01@gmail.com", 
      mission_type: request.type,
      location: request.location,
      description: request.description || "Urgent assistance required.",
      contact_phone: volunteer.phone || "Not provided",
      needer_name: request.requesterName,
      needer_phone: request.requesterPhone,
      needer_email: request.requesterEmail,
      dispatched_at: new Date().toLocaleString()
    };
    console.log(`DEBUG: Dispatch Email Sending to Volunteer: ${volunteer.email}`);



    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id', 
        templateParams, 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
      );
      return true;
    } catch (error) {
      console.error("EmailJS Error: ", error);
      return false;
    }
  };

  const handleFinalAssignment = async (v: any) => {
    if (!assigningTo) return;
    setSubmitting(true);
    console.log(`DEBUG: Assigning ${v.name} to request ${assigningTo.id}`);

    try {
      const rRef = doc(db, 'requests', assigningTo.id);
      const vRef = doc(db, 'volunteers', v.id);
      
      await updateDoc(rRef, { 
        assignedTo: v.name,
        status: 'active' 
      });
      console.log("DEBUG: Request updated.");

      await updateDoc(vRef, {
        status: 'inactive',
        currentAssignment: `${assigningTo.type} at ${assigningTo.location}`,
        assignedToNeeder: assigningTo.requesterName || 'Community Member',
        assignmentId: assigningTo.id
      });
      console.log("DEBUG: Volunteer status updated.");
      
      // 1. Notify Volunteer of their new Dispatch Assignment
      const vMailSent = await sendEmailNotification(v, assigningTo);
      console.log(`DEBUG: Volunteer notification sent: ${vMailSent}`);
      
      // 2. Notify the Needer that a volunteer is coming
      if (assigningTo.requesterEmail && !assigningTo.requesterEmail.includes('Not provided')) {
        try {
          const neederParams = {
            needer_name: assigningTo.requesterName,
            to_name: assigningTo.requesterName,
            to_email: assigningTo.requesterEmail,
            email: assigningTo.requesterEmail, // Ensure this goes to Needer
            needer_email: assigningTo.requesterEmail,
            from_name: "ResourceFlow Dispatch",
            hq_email: userProfile?.email || "resourceflow01@gmail.com",
            volunteer_name: v.name,
            volunteer_phone: v.phone || "Not provided",
            volunteer_email: v.email || "Not provided",
            request_type: assigningTo.type,
            mission_type: assigningTo.type,
            location: assigningTo.location,
            eta: "15-30 minutes (Estimated)",
            name: "Resource Flow",
            assigned_at: new Date().toLocaleString()
          };
          console.log(`DEBUG: Confirmation Email Sending to Needer: ${assigningTo.requesterEmail}`);
          
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
            import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID || 'template_confirm', 
            neederParams, 
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
          );
          console.log("DEBUG: Requester notification sent.");
        } catch (mailErr: any) {
          console.error("DEBUG: Requester Email Error:", mailErr);
        }
      }
      
      alert(`Dispatch Successful! Notifications sent to ${v.name} and the requester.`);
      setAssigningTo(null);
    } catch (err: any) { 
      console.error("CRITICAL: Assignment Error Details:", err);
      const errorMsg = err?.text || err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Unknown connection error";
      alert(`Assignment Error: ${errorMsg}`); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleUnassign = async (request: any) => {
    if (window.confirm('Are you sure you want to remove the assigned volunteer from this request?')) {
      setSubmitting(true);
      try {
        // 1. Set Volunteer back to active
        const volsRef = collection(db, 'volunteers');
        const q = query(volsRef, where('name', '==', request.assignedTo));
        const vSnap = await getDocs(q);
        
        if (!vSnap.empty) {
          const vDoc = vSnap.docs[0];
          await updateDoc(vDoc.ref, {
             status: 'active',
             currentAssignment: '',
             assignmentId: ''
          });
        }

        // 2. Set Request back to pending
        await updateDoc(doc(db, 'requests', request.id), {
          assignedTo: 'Unassigned',
          status: 'pending'
        });

      } catch (err: any) {
        alert("Error unassigning: " + err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };


  const handleDelete = async (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this request record?')) {
      await deleteDoc(doc(db, 'requests', requestId));
    }
  };

  const filtered = requests.filter(r => 
    r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.displayId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-8 sm:pb-0 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 text-left gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Assistance Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all help signals from the field.</p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto h-11 px-6 rounded-lg font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* DETAILS MODAL */}
        {viewingRequest && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewingRequest(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-6 border-b flex justify-between items-center text-left">
                  <h3 className="text-lg font-bold text-gray-900">Request #{viewingRequest.displayId}</h3>
                  <button onClick={() => setViewingRequest(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
               </div>
                <div className="p-8 space-y-6 text-left">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{viewingRequest.type}</p>
                        <h4 className="text-xl font-bold text-gray-900">{viewingRequest.location}</h4>
                        <p className="text-sm text-gray-500 font-medium">Requester: {viewingRequest.requesterName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={viewingRequest.status} />
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        viewingRequest.status === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        Urgency: {viewingRequest.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Contact Email</p>
                      <p className="text-xs font-bold text-gray-700 break-all">{viewingRequest.requesterEmail}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phone Number</p>
                      <p className="text-xs font-bold text-gray-700">{viewingRequest.requesterPhone}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Detailed Situation</p>
                    <p className="text-gray-700 leading-relaxed font-medium">"{viewingRequest.description}"</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 pt-2 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>Received {viewingRequest.created}</span>
                      </div>
                      <div className="flex items-center gap-2 border-l pl-6">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Assigned: <b className="text-gray-900 ml-1">{viewingRequest.assignedTo}</b></span>
                      </div>
                  </div>
                </div>
               <div className="p-6 bg-gray-50 flex gap-3">
                  <Button variant="secondary" className="flex-1 rounded-lg" onClick={() => setViewingRequest(null)}>Close</Button>
                  <Button variant="primary" className="flex-1 rounded-lg" onClick={() => {
                    setViewingRequest(null);
                    setAssigningTo(viewingRequest);
                  }}>Assign Volunteer</Button>
               </div>
            </div>
          </div>
        )}

        {/* ASSIGN VOLUNTEER MODAL */}
        {assigningTo && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setAssigningTo(null)} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                 <div className="p-6 border-b flex justify-between items-center text-left">
                    <h3 className="text-lg font-bold text-gray-900">Assign Responder</h3>
                    <button onClick={() => setAssigningTo(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                 </div>
                 <div className="p-6 max-h-[50vh] overflow-y-auto text-left">
                    {!availableVolunteers.length ? (
                       <div className="p-12 text-center text-gray-400">
                          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="font-medium">No available volunteers at the moment.</p>
                       </div>
                    ) : (
                       <div className="space-y-3">
                          {availableVolunteers.map(v => (
                             <div key={v.id} onClick={() => handleFinalAssignment(v)} className="p-4 bg-white border border-gray-100 hover:border-blue-500 rounded-xl cursor-pointer transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">{v.name.split(' ').map((n:any)=>n[0]).join('')}</div>
                                   <div>
                                       <h5 className="font-bold text-gray-900 text-sm">{v.name}</h5>
                                       <p className="text-xs text-gray-500">{v.specialty}</p>
                                   </div>
                                </div>
                                <UserCheck className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* NEW REQUEST MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
             <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
             <form onSubmit={handleCreateRequest} className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 sm:p-6 text-left animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                   <h3 className="text-lg font-bold text-gray-900">Create New Request</h3>
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4 text-gray-400" />
                   </button>
                </div>
                 <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Requester Name</label>
                      <input required placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full h-10 px-3.5 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Email</label>
                        <input required type="email" placeholder="mail@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full h-10 px-3 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Phone</label>
                        <input required type="tel" placeholder="Contact number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full h-10 px-3 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Category</label>
                        <select 
                          value={newType} 
                          onChange={(e) => {
                            setNewType(e.target.value);
                            setIsOther(e.target.value === 'Other');
                          }} 
                          className="w-full h-10 px-3 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs appearance-none"
                        >
                            <option>Police / Security</option>
                            <option>Medical / First Aid</option>
                            <option>Food & Water Relief</option>
                            <option>Search & Rescue</option>
                            <option>Logistics / Transport</option>
                            <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Urgency</label>
                        <select value={newUrgency} onChange={(e) => setNewUrgency(e.target.value)} className="w-full h-10 px-3 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs appearance-none">
                             <option value="low">Low</option>
                             <option value="medium">Medium</option>
                             <option value="urgent">Urgent</option>
                        </select>
                      </div>
                   </div>
                   {isOther && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Custom Type</label>
                       <input 
                         required 
                         placeholder="Describe type of help..." 
                         value={customType} 
                         onChange={(e) => setCustomType(e.target.value)} 
                         className="w-full h-11 px-4 bg-gray-50 border-0 rounded-lg outline-none font-medium text-sm" 
                       />
                     </div>
                   )}
                   <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Location</label>
                     <input required placeholder="Enter location..." value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full h-10 px-3.5 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Description</label>
                     <textarea rows={2} required placeholder="Describe the situation..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border-0 rounded-lg outline-none font-medium text-xs resize-none" />
                   </div>
                  </div>
                <div className="mt-6 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1 rounded-lg h-10 text-xs" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} variant="primary" className="flex-1 rounded-lg h-10 text-xs shadow-sm">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Request'}
                  </Button>
                </div>
             </form>
          </div>
        )}

        {/* RECENT REQUESTS TABLE */}
        <Card className="overflow-hidden border-orange-100/50 shadow-sm rounded-xl">
          <div className="p-4 border-b bg-gray-50/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by ID, location, or type..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
              />
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
             {isLoading ? (
               <div className="flex items-center justify-center p-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Loading data...</span></div>
             ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Requester</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Assigned To</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-gray-400">#{r.displayId}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{r.requesterName}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{r.type}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                           <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {r.location}
                           </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                         <td className="px-6 py-4">
                            {r.assignedTo === 'Unassigned' ? (
                              <span className="text-xs text-gray-400 font-medium whitespace-nowrap italic">Field Mission: Unassigned</span>
                            ) : (
                              <div className="flex flex-col gap-1 min-w-[120px]">
                                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 leading-none">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                  {r.assignedTo}
                                  <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleUnassign(r)}
                                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                      title="Remove Assignment"
                                    >
                                      <UserMinus className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => setAssigningTo(r)}
                                      className="p-1 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                      title="Change Responder"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest pl-5">{r.type}</div>
                              </div>
                            )}
                         </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-1">
                             <button onClick={() => setViewingRequest(r)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all" title="View"><Eye className="w-5 h-5"/></button>
                             <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all" title="Delete"><Trash2 className="w-5 h-5"/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>

          <div className="md:hidden p-4 space-y-3">
            {isLoading ? (
               <div className="flex items-center justify-center p-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Syncing signals...</span></div>
            ) : filtered.length === 0 ? (
               <p className="text-center py-8 text-gray-400 italic">No matching signals found.</p>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4 shadow-sm active:bg-gray-50 transition-all border-l-4 border-l-blue-500" onClick={() => setViewingRequest(r)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">REQ #{r.displayId}</p>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <p className="text-[9px] font-bold text-blue-500 uppercase">{r.created}</p>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">{r.requesterName}</h4>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">{r.type}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  
                  <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="truncate">{r.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                      <Mail className="w-3 h-3 text-blue-300" />
                      <span className="truncate">{r.requesterEmail}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 italic line-clamp-2 px-1">"{r.description}"</p>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-2 bg-blue-50/50 px-2 py-1 rounded-md">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Assigned:</p>
                        <p className="text-[10px] font-black text-gray-700">{r.assignedTo || 'Unassigned'}</p>
                        {r.assignedTo !== 'Unassigned' && (
                           <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1">
                              <button onClick={(e) => { e.stopPropagation(); handleUnassign(r); }} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Unassign"><UserMinus className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); setAssigningTo(r); }} className="p-1 text-blue-500 hover:bg-blue-100 rounded" title="Reassign"><UserPlus className="w-3 h-3" /></button>
                           </div>
                        )}
                     </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setViewingRequest(r); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
