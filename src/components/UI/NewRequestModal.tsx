import { useState } from 'react';
import { X, MapPin, Send } from 'lucide-react';
import Button from './Button';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
  const [selectedType, setSelectedType] = useState('Medical');
  const [customType, setCustomType] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    setGettingLoc(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGettingLoc(false);
          alert("📍 GPS Coordinates Captured! Your request will be pinpointed accurately on the tactical map.");
        },
        (err) => {
          console.error(err);
          setGettingLoc(false);
          alert("Unable to access GPS. Please enter your location manually.");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    const phone = formData.get('phone') as string;
    const urgency = formData.get('urgency') as string;
    const finalType = selectedType === 'Other' ? customType : selectedType;
    
    let finalLat = coords?.lat || null;
    let finalLng = coords?.lng || null;

    // Real-time Geocoding for typed addresses (Tactical Accuracy Upgrade)
    if (!finalLat && !finalLng && location) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', India')}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          finalLat = parseFloat(data[0].lat);
          finalLng = parseFloat(data[0].lon);
          console.log(`DEBUG: Geocoded ${location} to ${finalLat}, ${finalLng}`);
        }
      } catch (err) {
        console.warn("Geocoding failed, falling back to tactical mapping:", err);
      }
    }

    try {
      await addDoc(collection(db, 'requests'), {
        requesterName: name,
        requesterEmail: email,
        requesterPhone: phone,
        location: location,
        lat: finalLat,
        lng: finalLng,
        type: finalType,
        urgency: urgency || 'medium', 
        description: description,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      onClose();
      setTimeout(() => {
        alert('Request Submitted Successfully! Signal established on tactical network.');
      }, 100);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-sm transform overflow-hidden rounded-xl bg-white p-4 sm:p-5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="text-lg font-bold text-gray-900">New Assistance</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Requester Name</label>
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Category</label>
                <select 
                  name="type" 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold appearance-none"
                >
                  <option>Medical / First Aid</option>
                  <option>Food / Water Supply</option>
                  <option>Rescue / Emergency</option>
                  <option>Logistics / Transport</option>
                  <option>Other / Uncommon</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Urgency</label>
                <select 
                  name="urgency" 
                  className="w-full px-3 py-2 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold appearance-none"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="URGENT">Critical / Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="mail@ex.com"
                    className="w-full px-3 py-2 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold"
                    required
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Contact"
                    className="w-full px-3 py-2 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold"
                    required
                  />
               </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    name="location"
                    type="text"
                    placeholder="Location..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLoc}
                  className={`px-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    coords ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {gettingLoc ? '..' : coords ? '✓' : <MapPin className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {selectedType.includes('Other') && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider text-[11px] font-black">Specify Type</label>
                  <input
                    type="text"
                    placeholder="Explain the type of help..."
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Describe the situation..."
                className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-xs font-bold"
                required
              ></textarea>
            </div>

            <div className="pt-2 flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 h-10 text-xs rounded-xl" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 h-10 text-xs rounded-xl shadow-lg shadow-blue-500/10" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? '...' : <Send className="h-3.5 w-3.5 mr-2" />}
                Create Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
