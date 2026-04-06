import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import Button from '../components/UI/Button';
import NewRequestModal from '../components/UI/NewRequestModal';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Users, 
  CheckCircle, 
  Clock, 
  Brain, 
  Zap, 
  ArrowRight,
  Heart,
  ShieldCheck,
  Rocket
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

// ... existing formatTimeAgo and hashCode functions
const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Global L for Leaflet
declare const L: any;

interface RequestItem {
  id: string;
  type?: string;
  requesterName?: string;
  requesterEmail?: string;
  location?: string;
  urgency?: string;
  description?: string;
  createdAt?: any;
  status?: string;
  time?: string;
  lat?: number;
  lng?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(156);
  const [completedCount, setCompletedCount] = useState(43);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);

  useEffect(() => {
    // Admin/Responder Data
    const qCount = query(collection(db, 'requests'), where('status', 'in', ['pending', 'PENDING', 'urgent', 'URGENT', 'active', 'ACTIVE']));
    const unsubscribeCount = onSnapshot(qCount, (snapshot) => {
      setActiveRequestsCount(snapshot.size);
    });

    const qAll = query(collection(db, 'requests'));
    const unsubscribeAll = onSnapshot(qAll, (snapshot) => {
      const docs: RequestItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeAgo = 'Recently';
        try {
          if (data.createdAt) {
             const date = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date();
             timeAgo = formatTimeAgo(date);
          }
        } catch (e) {}
        
        return { 
          id: doc.id,
          ...data,
          time: timeAgo
        } as RequestItem;
      });
      
      const sortedDocs = [...docs].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setMapMarkers(sortedDocs);
      setRecentRequests(sortedDocs.slice(0, 4).map(d => ({
        id: d.id.substring(0, 8).toUpperCase(),
        type: d.type || 'General',
        requesterName: d.requesterName || 'Anonymous',
        location: d.location || 'Unknown',
        status: (d.status || d.urgency || 'pending').toLowerCase(),
        description: d.description || '',
        time: d.time
      })));
    });

    // -- VOLUNTEERS DATA --
    const unsubscribeVols = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
       const vols = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          isVolunteer: true 
       }));
       setVolunteers(vols);
       setVolunteerCount(vols.filter((v: any) => v.status === 'active' || v.status === 'ACTIVE').length);
    });

    // -- COMPLETED TODAY --
    const qDone = query(collection(db, 'requests'), where('status', 'in', ['completed', 'COMPLETED']));
    const unsubscribeDone = onSnapshot(qDone, (snapshot) => {
       setCompletedCount(snapshot.size);
    });

    // Personal Data (for Needer)
    let unsubscribePersonal: (() => void) | undefined;
    if (currentUser?.email) {
      const qPersonal = query(collection(db, 'requests'), where('requesterEmail', '==', currentUser.email));
      unsubscribePersonal = onSnapshot(qPersonal, (snapshot) => {
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          let timeAgo = 'Recently';
           try {
            if (data.createdAt) {
               const date = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date();
               timeAgo = formatTimeAgo(date);
            }
          } catch (e) {}
          return { id: doc.id, ...data, time: timeAgo } as RequestItem;
        });
        setMyRequests(docs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });
    }

    return () => {
      unsubscribeCount();
      unsubscribeAll();
      unsubscribeVols();
      unsubscribeDone();
      if (unsubscribePersonal) unsubscribePersonal();
    };
  }, [currentUser]);

  const handleDownloadReport = () => {
    if (mapMarkers.length === 0) {
      alert("No mission data available for report generation.");
      return;
    }

    // Header for CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "MISSION_ID,REQUESTER_IDENTITY,CONTACT_EMAIL,ASSISTANCE_CATEGORY,URGENCY_LEVEL,DEPLOYMENT_LOCATION,COORDINATES,MISSION_NARRATIVE,OPERATIONAL_STATUS,TIMESTAMP\n";

    // Add mission rows
    mapMarkers.forEach(m => {
      const row = [
        m.id.substring(0, 8).toUpperCase(),
        m.requesterName || "Anonymous",
        m.requesterEmail || "N/A",
        m.type || "General",
        (m.urgency || "Normal").toUpperCase(),
        `"${m.location || 'Unknown'}"`,
        `"${m.lat || 0},${m.lng || 0}"`, // GPS Coordinates
        `"${(m.description || '').replace(/"/g, '""')}"`, // Tactical Narrative
        (m.status || 'Active').toUpperCase(),
        m.time || "N/A"
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ResourceFlow_Tactical_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Leaflet Effect (Combined View)
  useEffect(() => {
    if (typeof L === 'undefined') return;

    if (mapRef.current && !leafletInstance.current) {
      try {
        const map = L.map(mapRef.current, {
          center: [17.3850, 78.4867], zoom: 11, minZoom: 4, maxZoom: 18,
          zoomControl: false, attributionControl: false,
          maxBounds: [[6.4626999, 68.1097], [35.513327, 97.3953586]]
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        markersGroup.current = L.featureGroup().addTo(map);
        leafletInstance.current = map;
        setTimeout(() => map.invalidateSize(), 500);
      } catch (err) { console.error("Leaflet init error:", err); }
    }

    if (leafletInstance.current && markersGroup.current) {
      markersGroup.current.clearLayers();
      
      const allPoints = [
        ...mapMarkers.map(m => ({ ...m, pType: 'request' })),
        ...volunteers.map(v => ({ ...v, pType: 'volunteer' }))
      ];

      allPoints.forEach(data => {
        let lat = data.lat;
        let lng = data.lng;

        // High-Precision Signal Detection Fallback (Tactical Mapping)
        if (!lat || !lng) {
           const loc = (data.location || '').toLowerCase();
           const seed = data.id || 'default';
           
           // City-Level Tactical Mapping
           if (loc.includes('hyd') || loc.includes('hyderabad') || loc.includes('gachibowli') || loc.includes('kukatpally') || loc.includes('secunderabad')) { 
             lat = 17.3850 + (hashCode(seed) % 800) / 10000; 
             lng = 78.4867 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('whitefield') || loc.includes('koramangala')) { 
             lat = 12.9716 + (hashCode(seed) % 800) / 10000; 
             lng = 77.5946 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('delhi') || loc.includes('noida') || loc.includes('gurgaon')) { 
             lat = 28.6139 + (hashCode(seed) % 800) / 10000; 
             lng = 77.2090 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('mumbai') || loc.includes('thane') || loc.includes('navi mumbai')) { 
             lat = 19.0760 + (hashCode(seed) % 800) / 10000; 
             lng = 72.8777 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('chennai') || loc.includes('velachery')) { 
             lat = 13.0827 + (hashCode(seed) % 800) / 10000; 
             lng = 80.2707 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('kolkata') || loc.includes('howrah')) { 
             lat = 22.5726 + (hashCode(seed) % 800) / 10000; 
             lng = 88.3639 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('pune')) { 
             lat = 18.5204 + (hashCode(seed) % 800) / 10000; 
             lng = 73.8567 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else if (loc.includes('vizag') || loc.includes('visakhapatnam')) { 
             lat = 17.6868 + (hashCode(seed) % 800) / 10000; 
             lng = 83.2185 + (hashCode(seed + "v") % 800) / 10000; 
           }
           else {
              // Default global scatter centered on main mission HQ (Hyderabad)
              lat = 17.3850 + (hashCode(seed) % 2000) / 1000;
              lng = 78.4867 + (hashCode(seed + "z") % 2000) / 1000;
           }
        }

        const isVolunteer = data.pType === 'volunteer';
        const isCompleted = !isVolunteer && ['completed', 'COMPLETED', 'resolved', 'RESOLVED'].includes(data.status || '');
        const isUrgent = data.urgency === 'URGENT' || data.urgency === 'urgent';
        
        // COLOR LOGIC:
        // Red = Alert (Request)
        // Blue = Volunteer
        // Gray = Solved
        let markerColor = '#ef4444'; // Default Red
        if (isVolunteer) markerColor = '#3b82f6'; // Blue
        if (isCompleted) markerColor = '#94a3b8'; // Gray

        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="position: relative; width: 14px; height: 14px;">
              ${(isUrgent || (!isVolunteer && !isCompleted)) ? `<div class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>` : ''}
              ${isVolunteer ? `<div class="absolute inset-0 rounded-full bg-blue-400 animate-pulse opacity-20"></div>` : ''}
              <div style="
                position: relative;
                background-color: ${markerColor}; 
                width: 14px; 
                height: 14px; 
                border-radius: 50%; 
                border: 2px solid white; 
                box-shadow: 0 0 15px ${markerColor}66;
                z-index: 10;
              "></div>
            </div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        });

        const popupContent = isVolunteer ? `
            <div style="font-family: sans-serif; padding: 5px; min-width: 150px;">
              <div style="display: flex; justify-between; align-items: center; margin-bottom: 8px;">
                 <b style="color: #1e40af; font-size: 14px;">${data.name}</b>
                 <span style="font-size: 8px; font-weight: 800; padding: 2px 6px; background: #dbeafe; color: #1e40af; border-radius: 4px; margin-left: auto;">RESPONDER</span>
              </div>
              <div style="font-size: 11px; color: #666;">
                <b>Role:</b> ${data.specialty || 'General Relief'}<br/>
                <b>Location:</b> ${data.location || 'Field Operations'}
              </div>
            </div>
        ` : `
            <div style="font-family: sans-serif; padding: 5px; min-width: 180px;">
              <div style="display: flex; justify-between; align-items: center; margin-bottom: 8px;">
                 <b style="color: #1e3a8a; font-size: 14px;">${data.type || 'Relief Request'}</b>
                 <span style="font-size: 8px; font-weight: 800; padding: 2px 6px; background: ${!isCompleted ? '#fee2e2' : '#f1f5f9'}; color: ${!isCompleted ? '#ef4444' : '#64748b'}; border-radius: 4px; margin-left: auto; text-transform: uppercase;">${data.status || 'Active'}</span>
              </div>
              <div style="margin-top: 4px; font-size: 11px; color: #444;">
                <b style="color: ${isUrgent ? '#ef4444' : '#3b82f6'}">${(data.urgency || 'Normal').toUpperCase()}</b> • ${data.location}
              </div>
              <p style="font-size: 11px; margin-top: 8px; color: #666; font-style: italic; border-top: 1px solid #f1f5f9; pt-2;">"${data.description || 'No additional details provided.'}"</p>
            </div>
        `;

        const marker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(popupContent);
        markersGroup.current.addLayer(marker);
      });
      if (allPoints.length > 0) leafletInstance.current.fitBounds(markersGroup.current.getBounds(), { padding: [50, 50], maxZoom: 13 });
    }
  }, [mapMarkers, volunteers, userProfile]);

  const getAIAnalysis = () => {
    if (mapMarkers.length === 0) return null;
    const typeCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    let urgentCount = 0;
    mapMarkers.forEach(m => {
      // PRESSURE LOGIC: Only count requests that are NOT yet assigned or completed
      const isHandled = ['assigned', 'completed', 'ASSIGNED', 'COMPLETED'].includes(m.status || '');
      if (isHandled) return;

      const type = m.type || 'General';
      const loc = (m.location || 'Unknown').split(',')[0].trim();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      if (m.urgency === 'urgent' || m.urgency === 'URGENT') urgentCount++;
    });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const topLoc = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
    const latestSignal = [...mapMarkers].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
    const duplicatePattern = Object.entries(locationCounts).find(([_, count]) => count > 1);
    const criticalSignals = mapMarkers.filter(m => m.urgency === 'URGENT' || m.urgency === 'urgent');

    let insight = "Operational stability maintained.";
    if (urgentCount > 0) {
      insight = `${urgentCount} critical ${urgentCount === 1 ? 'signal' : 'signals'} requiring immediate attention in ${topLoc ? topLoc[0] : 'active zones'}.`;
    }
    if (urgentCount > mapMarkers.length * 0.4) {
      insight = `CRITICAL: Major surge in ${topType ? topType[0] : 'relief'} requests. Immediate resource reallocation recommended.`;
    }

    return {
      focusArea: topLoc ? topLoc[0] : 'Scanning...',
      priorityNeed: topType ? topType[0] : 'General Relief',
      urgencyLevel: Math.round((urgentCount / (mapMarkers.length || 1)) * 100),
      recentAlert: latestSignal ? `${latestSignal.type} at ${latestSignal.location}` : null,
      patternAlert: duplicatePattern ? `Multiple signals detected at ${duplicatePattern[0]}` : null,
      urgentCount,
      insight,
      criticalList: criticalSignals.slice(0, 2).map(s => ({
        type: s.type || 'Relief',
        loc: s.location || 'Unknown'
      }))
    };
  };

  const aiInsight = getAIAnalysis();

  // --- RENDERING NEEDER DASHBOARD ---
  if (userProfile?.role === 'needer') {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
          <NewRequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
          
          <div className="mb-10 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Welcome, {userProfile.name.split(' ')[0]}</h1>
            </div>
            <p className="text-gray-500 font-medium">How can ResourceFlow support you today?</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12">
             <Card className="p-6 sm:p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="w-20 sm:w-24 h-20 sm:h-24" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black mb-4 tracking-tight">Need Urgent Assistance?</h2>
                    <p className="text-blue-50/80 text-sm mb-8 leading-relaxed max-w-xs font-medium">Our network of responders is standing by. Click below to alert nearby volunteer teams.</p>
                  </div>
                  <Button 
                    variant="primary" 
                    className="h-12 w-full sm:w-max px-8 !bg-white !text-blue-600 hover:!bg-blue-50 border-0 font-black shadow-2xl transition-all hover:scale-105" 
                    onClick={() => setIsRequestModalOpen(true)}
                  >
                    Request Help Now
                    <ArrowRight className="ml-2 w-5 h-5 font-black" />
                  </Button>
                </div>
             </Card>

             <Card className="p-6 sm:p-8 border-gray-100 flex flex-col justify-between shadow-sm">
                <div>
                   <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Community Resilience</h3>
                   <p className="text-sm text-gray-500 leading-relaxed italic font-medium">"The greatness of a community is most accurately measured by the compassionate actions of its members."</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8">
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <Users className="w-5 h-5 text-blue-500 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Volunteers Active</p>
                      <p className="text-lg font-black text-gray-900">156</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                      <p className="text-lg font-black text-green-600 uppercase">Secured</p>
                   </div>
                </div>
             </Card>
          </div>

          <div className="space-y-6 text-left">
             <div className="flex items-center justify-between border-b pb-4 border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">My Active Requests</h2>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">{myRequests.length} SIGNALS</span>
             </div>

             {myRequests.length === 0 ? (
               <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <Clock className="w-12 h-12 text-gray-200 mb-4" />
                  <p className="text-gray-400 font-medium">No active requests currently recorded.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {myRequests.map(req => (
                    <Card key={req.id} className="p-5 hover:border-blue-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                             <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900 leading-none mb-1.5">{req.type} Assistance</h4>
                             <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mb-2">
                                <MapPin className="w-3 h-3" />
                                {req.location}
                             </p>
                             <p className="text-xs text-gray-400 line-clamp-1 italic">"{req.description}"</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                          <div className="text-right hidden sm:block mr-2">
                             <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Requested</p>
                             <p className="text-xs font-bold text-gray-900">{req.time}</p>
                          </div>
                          <StatusBadge status={(req.status || req.urgency || 'pending').toLowerCase() as any} />
                       </div>
                    </Card>
                  ))}
               </div>
             )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --- RENDERING RESPONDER DASHBOARD (Admin) ---
  const stats = [
    { label: 'Active Requests', value: activeRequestsCount.toString(), change: '+12%', trend: 'up', icon: AlertCircle },
    { label: 'Available Volunteers', value: volunteerCount.toString(), change: '+8%', trend: 'up', icon: Users },
    { label: 'Completed Missions', value: completedCount.toString(), change: '+5%', trend: 'up', icon: CheckCircle },
    { label: 'Avg Response Time', value: '12 min', change: '-15%', trend: 'up', icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-8 sm:pb-0">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time status of relief operations</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownloadReport}>
            Download Report
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-3 sm:p-6 hover:shadow-lg transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors pointer-events-none">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className={`flex items-center text-[10px] sm:text-xs font-black px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <Card className="p-0 border-0 bg-gradient-to-br from-slate-900 to-blue-950 text-white overflow-hidden shadow-2xl relative min-h-[300px] flex items-center">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="w-32 h-32" />
            </div>
            <div className="p-6 relative z-10 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">AI Stratos Insight</h2>
                    <p className="text-[10px] text-blue-300 font-mono tracking-widest uppercase">Real-time Deployment Logic</p>
                  </div>
                </div>
                <div 
                   onClick={() => navigate('/requests')}
                   className="flex items-center gap-4 p-5 bg-blue-600/20 hover:bg-blue-600/40 border border-white/10 rounded-2xl cursor-pointer transition-all active:scale-95 group/btn"
                >
                   <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-900/40 group-hover/btn:scale-110 transition-transform">
                      <Rocket className="w-5 h-5 text-white" />
                   </div>
                   <div className="text-left">
                      <h3 className="font-black text-white text-base leading-none">Initiate Mission</h3>
                      <p className="text-[8px] text-blue-200 font-bold uppercase tracking-widest mt-1 leading-none">Deploy Tactical Center</p>
                   </div>
                </div>
              </div>

              {aiInsight && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pt-6 border-t border-white/10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest mb-1">Focus Zone</p>
                        <p className="text-2xl font-black text-white">{aiInsight.focusArea}</p>
                      </div>
                      <div className="bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest mb-1">Primary Need</p>
                        <p className="text-2xl font-black text-white">{aiInsight.priorityNeed}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 italic text-blue-50/90 font-medium leading-relaxed">
                       "{aiInsight.insight}"
                    </div>
                  </div>
                  <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-8">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                           <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Pressure Index</p>
                           <p className="text-3xl font-black text-white">{aiInsight.urgencyLevel}%</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-red-400 mb-1" />
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${aiInsight.urgencyLevel}%` }} />
                      </div>
                      
                      {aiInsight.urgentCount > 0 && (
                        <div className="mt-6 space-y-3">
                          <p className="text-[9px] font-bold text-red-300 uppercase tracking-widest">Immediate Attention Required</p>
                          <div className="space-y-2">
                             {aiInsight.criticalList.map((s, idx) => (
                               <div key={idx} className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center justify-between text-[10px] animate-pulse">
                                  <span className="font-bold text-red-100">{s.type}</span>
                                  <span className="text-red-300 opacity-80">{s.loc}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-3 sm:p-6 h-[400px] sm:h-[450px] flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Ops Map
              </h2>
            <div className="relative flex-1 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 z-10 transition-all">
              <div ref={mapRef} className="w-full h-full" id="relief-map" />
              <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-[10px] space-y-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                  <span className="font-bold text-gray-700">{mapMarkers.length} Live Signals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="font-bold text-gray-700">156 Task Force</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6 flex flex-col">

            <Card className="p-6 flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Recent Signals</h2>
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline" onClick={() => navigate('/requests')}>Full Log</button>
              </div>
              <div className="space-y-5">
                {recentRequests.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 italic">Scanning signals...</p>
                ) : (
                  recentRequests.map((request, i) => (
                    <div key={i} className="flex items-start gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                       <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-2 mb-1">
                             <h4 className="text-sm font-bold text-gray-900 truncate">{request.requesterName}</h4>
                             <span className="text-[10px] text-gray-400 whitespace-nowrap">{request.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mb-2">{request.location} • <span className="text-blue-600 font-bold">{request.type}</span></p>
                          <StatusBadge status={request.status as any} />
                       </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
