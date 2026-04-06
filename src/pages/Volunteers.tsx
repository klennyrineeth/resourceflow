import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import StatusBadge from '../components/UI/StatusBadge';
import { 
  Plus, 
  MapPin, 
  Award, 
  X, 
  User, 
  Users,
  Loader2,
  Briefcase,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit2,
  Package,
  Zap,
  Clock
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import emailjs from '@emailjs/browser';
import { useAuth } from '../lib/AuthContext';

interface Volunteer {
  id: string;
  name: string;
  specialty: string;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;

  tasks: number;
  joined: string;
  phone: string;
  email: string;
  currentAssignment?: string;
  assignmentId?: string;
}

interface RequestItem {
  id: string;
  type: string;
  location: string;
  description: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
}


interface ResourceItem {
  id: string;
  name: string;
  assignedToId?: string;
}

export default function Volunteers() {
  const { userProfile } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [deployedVolunteers, setDeployedVolunteers] = useState<Volunteer[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<Volunteer[]>([]);
  const [availableRequests, setAvailableRequests] = useState<RequestItem[]>([]);

  const [assignedResources, setAssignedResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [assigningTo, setAssigningTo] = useState<Volunteer | null>(null);
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('Medical / First Aid');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');

  useEffect(() => {
    // Resources Tracking
    const unsubscribeRes = onSnapshot(collection(db, 'resources'), (snapshot) => {
      setAssignedResources(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ResourceItem[]);
    });

    const seedClassicVolunteers = async () => {
      const snap = await getDocs(collection(db, 'volunteers'));
      if (snap.empty) {
        const classics = [
          { name: 'John Smith', specialty: 'Medical / First Aid', location: 'Downtown', status: 'active', rating: 4.9, tasks: 12, joined: 'Mar 2024', phone: '+1 (555) 123-4567', email: 'john.s@relay.org' },
          { name: 'Sarah Johnson', specialty: 'Logistics / Transport', location: 'East Side', status: 'active', rating: 4.8, tasks: 28, joined: 'Jan 2024', phone: '+1 (555) 987-6543', email: 'sarah.j@transport.net' },
          { name: 'Officer Miller', specialty: 'Police / Security', location: 'Commercial Belt', status: 'active', rating: 4.9, tasks: 8, joined: 'Apr 2024', phone: '+1 (555) 000-1111', email: 'miller.pd@city.gov' }
        ];
        for (const v of classics) { await addDoc(collection(db, 'volunteers'), v); }
      }
    };
    seedClassicVolunteers();

    const unsubscribeVols = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Volunteer[];
      setVolunteers(all.filter(v => v.status === 'active'));
      setDeployedVolunteers(all.filter(v => v.status === 'inactive'));
      setPendingVolunteers(all.filter(v => v.status === 'pending' || !v.status));
      setLoading(false);
    });


    const qReqs = query(collection(db, 'requests'), where('status', 'in', ['pending', 'Pending', 'low', 'Low', 'medium', 'Medium', 'urgent', 'URGENT']));
    const unsubscribeReqs = onSnapshot(qReqs, (snapshot) => {
      const data = snapshot.docs
        .filter(d => !d.data().assignedTo || d.data().assignedTo === 'Unassigned')
        .map(d => ({
          id: d.id,
          type: d.data().type || 'General Relief',
          location: d.data().location || 'Unknown Area',
          description: d.data().description || '',
          requesterName: d.data().requesterName || 'Requester',
          requesterEmail: d.data().requesterEmail || '',
          requesterPhone: d.data().requesterPhone || d.data().requesterPhone || 'Not provided'
        }));
      setAvailableRequests(data);

    });

    return () => { 
      unsubscribeVols(); 
      unsubscribeReqs(); 
      unsubscribeRes();
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setSubmitting(true);
    try {
      const finalSpecialty = newSpecialty === 'Other / Skilled Professional' ? customSpecialty : newSpecialty;
      if (editingVolunteer) {
        await updateDoc(doc(db, 'volunteers', editingVolunteer.id), {
          name: newName,
          specialty: finalSpecialty,
          phone: newPhone,
          email: newEmail,
          location: newLocation
        });
      } else {
        await addDoc(collection(db, 'volunteers'), {
          name: newName,
          specialty: finalSpecialty,
          location: newLocation || 'Region Office',
          status: 'active',
          rating: 5.0,
          tasks: 0,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          phone: newPhone,
          email: newEmail,
          createdAt: serverTimestamp()
        });

        // Notify the new volunteer
        const templateParams = {
          to_name: newName,
          name: newName, // Match {{name}}
          to_email: newEmail,
          email: newEmail, // Match {{email}}
          specialty: finalSpecialty,
          location: newLocation || 'Region Office',
          submitted_at: new Date().toLocaleString()
        };

        try {
          // 1. Send Confirmation to Volunteer
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
            import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID || 'template_confirm', 
            templateParams, 
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
          );

          // 2. Alert Admin (New Volunteer Enlisted)
          const adminAlertParams = {
            ...templateParams,
            to_name: 'Admin Coordinator',
            to_email: 'resourceflow01@gmail.com',
            email: 'resourceflow01@gmail.com',
            subject: `NEW ENLISTMENT: ${newName}`
          };

          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id', 
            adminAlertParams, 
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
          );
        } catch (error) {
          console.error("Volunteer Enlistment Email Error:", error);
        }
      }


      setIsAddModalOpen(false);
      setEditingVolunteer(null);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewLocation('');
      setCustomSpecialty('');
      setNewSpecialty('Medical / First Aid');
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const sendEmailNotification = async (volunteer: Volunteer, request: RequestItem | 'manual') => {
    // Collect specific dispatch details
    const templateParams = {
      to_name: volunteer.name,
      to_email: volunteer.email, // Actual Target
      email: volunteer.email, // Match {{email}} for EmailJS routing
      volunteer_email: volunteer.email,
      from_name: "ResourceFlow HQ",
      hq_email: userProfile?.email || "resourceflow01@gmail.com",
      mission_type: request === 'manual' ? "General Assistance Dispatch" : request.type,
      location: request === 'manual' ? "Regional Operations Center" : request.location,
      description: request === 'manual' ? "Standby for coordinated relief efforts." : (request.description || "Urgent assistance required."),
      contact_phone: volunteer.phone,
      needer_name: request === 'manual' ? 'N/A' : request.requesterName,
      needer_phone: request === 'manual' ? 'N/A' : request.requesterPhone,
      needer_email: request === 'manual' ? 'N/A' : request.requesterEmail,
      dispatched_at: new Date().toLocaleString()
    };
    console.log(`DEBUG: Dispatch Email Sending to Volunteer: ${volunteer.email}`);


    try {
      // Connects to EmailJS account using your Service, Template, and Public Key IDs
      // I'll use placeholders for you to fill in your private keys!
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id', 
        templateParams, 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
      );
      return true;
    } catch (error) {
      console.error("EmailJS Error: ", error);
      // Fallback for demo if keys aren't set yet
      console.warn("Emails not landing? Make sure VITE_EMAILJS_ keys are set in your .env file!");
      return false;
    }
  };



  const handleFinalAssignment = async (volunteer: Volunteer, request: RequestItem | 'manual') => {
    setActionLoading(volunteer.id);
    console.log(`DEBUG: Starting assignment for ${volunteer.name}. Target:`, request);
    
    try {
      const vRef = doc(db, 'volunteers', volunteer.id);
      const assignmentInfo = request === 'manual' ? "General Assistance" : `${request.type}: ${request.location}`;
      
      // Update Volunteer Status
      await updateDoc(vRef, { 
        status: 'inactive', 
        currentAssignment: assignmentInfo, 
        assignmentId: request === 'manual' ? 'MANUAL' : request.id 
      });
      console.log("DEBUG: Volunteer status updated in Firestore.");

      // Update Request Status (Set to 'active' while responder is on the move)
      if (request !== 'manual') {
        const rRef = doc(db, 'requests', request.id);
        await updateDoc(rRef, { 
          assignedTo: volunteer.name, 
          status: 'active' 
        });
        console.log("DEBUG: Request status updated to active.");
      }
      
      // 1. Notify Volunteer of their new Dispatch Assignment
      const vMailSent = await sendEmailNotification(volunteer, request);
      console.log(`DEBUG: Volunteer notification sent: ${vMailSent}`);
      
      // 2. Notify Requesting Party (if applicable)
      if (request !== 'manual' && request.requesterEmail && !request.requesterEmail.includes('Not provided')) {
        try {
          const neederParams = {
            needer_name: request.requesterName,
            to_name: request.requesterName,
            to_email: request.requesterEmail,
            email: request.requesterEmail, // Ensure this goes to Needer
            needer_email: request.requesterEmail,
            from_name: "ResourceFlow Dispatch",
            hq_email: userProfile?.email || "resourceflow01@gmail.com",
            volunteer_name: volunteer.name,
            volunteer_phone: volunteer.phone || "Not provided",
            volunteer_email: volunteer.email || "Not provided",
            request_type: request.type,
            mission_type: request.type,
            location: request.location,
            eta: "15-30 minutes (Estimated)",
            name: "Resource Flow",
            assigned_at: new Date().toLocaleString()
          };
          console.log(`DEBUG: Confirmation Email Sending to Needer: ${request.requesterEmail}`);
          
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
            import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID || 'template_confirm', 
            neederParams, 
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
          );
          console.log("DEBUG: Requester notification sent.");
        } catch (mailErr: any) {
          console.error("DEBUG: Requester Email Error:", mailErr);
          // We don't block the whole process if just the second email fails
        }
      }
      
      alert(`Dispatch Successful! Notification sent to ${volunteer.name}${request !== 'manual' ? ' and the requester' : ''}.`);
      
      setAssigningTo(null);
      setViewingVolunteer(null);
    } catch (err: any) { 
      console.error("CRITICAL: Assignment Error Details:", err);
      const errorMsg = err?.text || err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Unknown connection error";
      alert(`Assignment Error: ${errorMsg}`); 
    } finally { 
      setActionLoading(null); 
    }
  };

  const handleUnassign = async (v: Volunteer) => {
    setActionLoading(v.id);
    try { await updateDoc(doc(db, 'volunteers', v.id), { status: 'active', tasks: (v.tasks || 0) + 1, currentAssignment: '', assignmentId: '' }); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async (v: Volunteer) => {
    setActionLoading(v.id);
    try {
      await updateDoc(doc(db, 'volunteers', v.id), { status: 'active' });
      alert(`${v.name} has been verified as a Certified Responder.`);
    } catch (err: any) { alert(`Error approving volunteer: ${err.message}`); }
    finally { setActionLoading(null); }
  };


  const handleDelete = async (vid: string) => {
    if (window.confirm('Are you sure you want to remove this volunteer?')) {
      await deleteDoc(doc(db, 'volunteers', vid));
    }
  };

  const openEditModal = (v: Volunteer) => {
    setEditingVolunteer(v);
    setNewName(v.name);
    setNewPhone(v.phone);
    setNewEmail(v.email || '');
    setNewLocation(v.location);
    
    const baseSpecialties = [
      'Police / Security',
      'Medical / First Aid',
      'Food & Water Relief',
      'Search & Rescue',
      'Logistics / Transport'
    ];
    
    if (baseSpecialties.includes(v.specialty)) {
      setNewSpecialty(v.specialty);
      setCustomSpecialty('');
    } else {
      setNewSpecialty('Other / Skilled Professional');
      setCustomSpecialty(v.specialty);
    }
    
    setIsAddModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-8 max-w-7xl mx-auto pb-32">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 text-left gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Volunteer Personnel</h1>
            <p className="text-sm text-gray-500 mt-1">Manage responders, update profiles, or remove entries.</p>
          </div>
          <Button variant="primary" onClick={() => { setEditingVolunteer(null); setNewName(''); setNewPhone(''); setNewEmail(''); setNewLocation(''); setIsAddModalOpen(true); }} className="w-full sm:w-auto h-11 px-6 rounded-lg font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Volunteer
          </Button>
        </div>

        {/* --- PENDING APPLICATIONS (NEW) --- */}
        {pendingVolunteers.length > 0 && (
          <section className="mb-20 text-left animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 mb-8 border-b border-orange-100 pb-4">
                <h2 className="text-lg font-bold text-orange-800 uppercase tracking-tight flex items-center gap-2">
                   <Clock className="w-5 h-5" /> 
                   Pending Applications
                </h2>
                <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-md font-black">{pendingVolunteers.length} NEW</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingVolunteers.map(v => (
                   <Card key={v.id} className="p-6 border border-orange-100 bg-orange-50/10 rounded-2xl flex flex-col shadow-sm relative group overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                      <div className="flex items-center gap-4 mb-6 relative">
                         <div className="w-12 h-12 bg-orange-100/50 text-orange-700 rounded-xl flex items-center justify-center font-bold">{v.name[0]}</div>
                         <div>
                            <h3 className="font-bold text-gray-900 leading-none">{v.name}</h3>
                            <p className="text-[10px] font-bold text-orange-600/70 mt-1 uppercase italic">{v.specialty || 'General Applicant'}</p>
                         </div>
                      </div>
                      <div className="space-y-4 relative">
                         <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                             <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</div>
                         </div>
                         <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 h-10 text-[10px] font-bold uppercase border-orange-200 text-orange-700 bg-white" onClick={() => setViewingVolunteer(v)}>Review</Button>
                            <Button variant="primary" className="flex-[1.5] h-10 text-[10px] font-bold uppercase shadow-md bg-orange-600 hover:bg-orange-700 border-none px-4" onClick={() => handleApprove(v)} disabled={!!actionLoading}>
                               {actionLoading === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify & Admit'}
                            </Button>
                         </div>
                      </div>
                   </Card>
                ))}
             </div>
          </section>
        )}


        {/* --- AVAILABLE VOLUNTEERS (Section 1) --- */}
        <section className="mb-16 text-left">
          <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
             <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Available Personnel</h2>
             <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-md font-black">{volunteers.length} ACTIVE</span>
          </div>

          {loading ? (
             <div className="h-60 flex items-center justify-center p-12 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mr-3" /><span>Loading responders...</span></div>
          ) : volunteers.length === 0 ? (
             <div className="p-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Currently no available responders on standby.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {volunteers.map((v) => (
                <Card key={v.id} className="p-6 border border-gray-100 hover:border-blue-200 transition-all rounded-2xl bg-white shadow-sm flex flex-col group/card relative">
                  
                  {/* Actions Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(v)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg">{v.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                          <h3 className="font-bold text-gray-900 leading-none">{v.name}</h3>
                          <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wide">{v.specialty}</p>
                      </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status="active" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 mt-2">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <p className="flex items-center text-[10px] font-bold text-gray-400 uppercase mb-1"><MapPin className="w-3 h-3 mr-1" />Location</p>
                        <p className="text-xs font-bold text-gray-700">{v.location}</p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <p className="flex items-center text-[10px] font-bold text-gray-400 uppercase mb-1"><Award className="w-3 h-3 mr-1" />Rating</p>
                        <p className="text-xs font-bold text-gray-700">{v.rating}/5.0</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 rounded-lg h-10 text-xs font-bold" onClick={() => setViewingVolunteer(v)}>Profile</Button>
                    <Button variant="primary" className="flex-[1.5] rounded-lg h-10 text-xs font-bold shadow-sm" onClick={() => setAssigningTo(v)}>Assign Task</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* --- ASSIGNED SECTION --- */}
        <section className="mb-20 text-left">
           <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
             <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Active Assignments</h2>
             <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-md font-black">{deployedVolunteers.length} ON MISSION</span>
          </div>
          {deployedVolunteers.length === 0 ? (
             <div className="py-12 text-center text-gray-400 border border-dashed border-gray-100 rounded-2xl">No active assignments recorded.</div>
          ) : (
             <div className="space-y-3">
                  {deployedVolunteers.map(v => (
                    <Card key={v.id} className="p-4 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm group/row relative gap-4">
                       <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5" /></div>
                          <div className="text-left min-w-0 flex-1">
                             <h4 className="font-bold text-gray-900 text-sm leading-tight flex flex-wrap items-center">
                               {v.name} 
                               <span className="mx-2 text-gray-300 font-medium">→</span> 
                               <span className="text-emerald-700 truncate max-w-[150px] sm:max-w-none">{v.currentAssignment}</span>
                             </h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{v.specialty} Ops</p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                          <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50 sm:opacity-0 sm:group-hover/row:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                          <Button variant="ghost" onClick={() => handleUnassign(v)} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold uppercase text-[10px] px-4 h-10 rounded-lg border border-emerald-100" disabled={Boolean(actionLoading)}>
                             {actionLoading === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Mission'}
                          </Button>
                       </div>
                    </Card>
                  ))}
             </div>
          )}
        </section>

        {/* PROFILE MODAL */}
        {viewingVolunteer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewingVolunteer(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200 mx-4">
               <div className="p-5 border-b flex justify-between items-center bg-gray-50/10">
                  <h3 className="text-lg font-bold text-gray-900">Volunteer Record</h3>
                  <button onClick={() => setViewingVolunteer(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
               </div>
               <div className="p-5 space-y-5">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0"><User className="w-7 h-7" /></div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{viewingVolunteer.name}</h3>
                        <p className="text-blue-600 font-bold uppercase text-[10px] tracking-wide mt-0.5 italic">{viewingVolunteer.specialty}</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <Mail className="w-3.5 h-3.5 text-blue-500 mb-1" />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Email Address</p>
                        <p className="text-[9.5px] font-bold text-gray-900 break-all leading-tight">{viewingVolunteer.email}</p>
                     </div>
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Phone Line</p>
                        <p className="text-[11px] font-bold text-gray-900">{viewingVolunteer.phone}</p>
                     </div>
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 mb-1" />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Base Location</p>
                        <p className="text-[11px] font-bold text-gray-900 truncate">{viewingVolunteer.location || 'Not Specified'}</p>
                     </div>
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50 font-bold">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 mb-1" />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Experience</p>
                        <p className="text-[11px] font-bold text-gray-900">{viewingVolunteer.tasks} Missions</p>
                     </div>
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 mb-1" />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Enlisted Since</p>
                        <p className="text-[11px] font-bold text-gray-900">{viewingVolunteer.joined}</p>
                     </div>
                     <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <Zap className={`w-3.5 h-3.5 mb-1 ${viewingVolunteer.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
                        <p className="text-[8.5px] font-bold text-gray-400 uppercase mb-0.5 leading-none">Duty Status</p>
                        <p className={`text-[11px] font-bold ${viewingVolunteer.status === 'active' ? 'text-green-600' : 'text-gray-500 uppercase'}`}>{viewingVolunteer.status}</p>
                     </div>
                  </div>

                  {/* Allocated Assets Section */}
                  {assignedResources.filter(r => r.assignedToId === viewingVolunteer.id).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        Allocated Assets
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {assignedResources
                          .filter(r => r.assignedToId === viewingVolunteer.id)
                          .map(res => (
                            <div key={res.id} className="inline-flex items-center px-3 py-1.5 bg-blue-50/70 text-blue-700 rounded-lg border border-blue-100 text-[11px] font-bold">
                              {res.name}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1 h-10 rounded-lg font-bold flex gap-2 items-center justify-center border-gray-200 text-xs" onClick={() => openEditModal(viewingVolunteer)}><Edit2 className="w-3.5 h-3.5" /> Edit Profile</Button>
                    <Button variant="primary" className="flex-1 h-10 rounded-lg font-bold flex gap-2 items-center justify-center text-xs" onClick={() => { setViewingVolunteer(null); setAssigningTo(viewingVolunteer); }}>Assign Task</Button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENT MODAL */}
        {assigningTo && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setAssigningTo(null)} />
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                 <div className="p-6 border-b flex justify-between items-center text-left">
                    <h3 className="text-lg font-bold text-gray-900">Match Task for {assigningTo.name}</h3>
                    <button onClick={() => setAssigningTo(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
                 </div>
                 <div className="p-6 max-h-[50vh] overflow-y-auto text-left">
                    {availableRequests.length === 0 ? (
                       <div className="p-10 text-center bg-gray-50 rounded-xl">
                          <p className="text-gray-400 font-medium mb-5">No active requests currently pending.</p>
                          <Button variant="primary" className="h-11 px-8 rounded-lg text-sm font-bold" onClick={() => handleFinalAssignment(assigningTo, 'manual')}>Assign to General Region</Button>
                       </div>
                    ) : (
                       <div className="space-y-2">
                          {availableRequests.map(req => (
                             <div key={req.id} onClick={() => handleFinalAssignment(assigningTo, req)} className="p-5 bg-white border border-gray-100 hover:border-blue-500 rounded-xl cursor-pointer transition-all hover:bg-blue-50/30 group">
                                <div className="flex justify-between items-start">
                                   <div>
                                       <div className="flex justify-between items-center mb-1">
                                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider italic">{req.type}</p>
                                          <span className="text-[10px] font-bold text-gray-400">By: {req.requesterName}</span>
                                       </div>
                                       <h5 className="font-bold text-gray-900 mb-1 leading-tight">{req.location}</h5>
                                       <p className="text-xs text-gray-500 line-clamp-1">"{req.description || 'Assistance requested...'}"</p>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* ADD / EDIT MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setEditingVolunteer(null); }} />
            <form onSubmit={handleRegister} className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl text-left animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{editingVolunteer ? 'Edit Record' : 'Register Responder'}</h3>
                <button type="button" className="p-1 hover:bg-gray-100 rounded-lg text-gray-400" onClick={() => { setIsAddModalOpen(false); setEditingVolunteer(null); }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Full Name</label>
                   <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm shadow-inner" placeholder="E.g. John Doe..." />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Specialty</label>
                   <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm shadow-inner cursor-pointer">
                        <option>Police / Security</option>
                        <option>Medical / First Aid</option>
                        <option>Food & Water Relief</option>
                        <option>Search & Rescue</option>
                        <option>Logistics / Transport</option>
                        <option>Other / Skilled Professional</option>
                   </select>
                   {newSpecialty === 'Other / Skilled Professional' && (
                       <input 
                         required 
                         value={customSpecialty} 
                         onChange={(e) => setCustomSpecialty(e.target.value)} 
                         className="w-full h-10 px-4 bg-blue-50 border border-blue-200 rounded-xl outline-none font-medium text-sm mt-3 animate-in slide-in-from-top-2 duration-200" 
                         placeholder="Enter custom role..." 
                       />
                    )}
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Phone</label>
                    <input required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm shadow-inner" placeholder="+1..." />
                 </div>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Email</label>
                        <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm shadow-inner" placeholder="mail@xyz.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Location</label>
                        <input required value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm shadow-inner" placeholder="City..." />
                    </div>
                 </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button type="button" variant="secondary" className="flex-1 h-11 rounded-xl font-bold text-xs border-gray-200" onClick={() => { setIsAddModalOpen(false); setEditingVolunteer(null); }}>Discard</Button>
                <Button type="submit" variant="primary" className="flex-[2] h-11 rounded-xl font-bold text-xs shadow-lg shadow-blue-100" disabled={submitting}>
                  {submitting ? 'Saving...' : editingVolunteer ? 'Update Entry' : 'Enlist Responder'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
