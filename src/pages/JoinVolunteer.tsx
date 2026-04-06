import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Heart, 
  ShieldCheck, 
  Phone, 
  CheckCircle, 
  Backpack, 
  ArrowRight,
  Stethoscope,
  Truck,
  Utensils,
  Loader2,
  HelpCircle
} from 'lucide-react';
import Button from '../components/UI/Button';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import Footer from '../components/Layout/Footer';


export default function JoinVolunteer() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    lat: null as number | null,
    lng: null as number | null,
    specialty: 'Medical / First Aid',
    customSpecialty: '',
    bio: ''
  });

  const handleGetLocation = () => {
    setGettingLoc(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({ 
            ...prev, 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          }));
          setGettingLoc(false);
          alert("📍 Location pinpointed! Your responder profile will now show your accurate operational area.");
        },
        (err) => {
          console.error(err);
          setGettingLoc(false);
          alert("Unable to access GPS. Please enter your base location manually.");
        }
      );
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      const finalSpecialty = formData.specialty === 'Other / Global Support' ? formData.customSpecialty : formData.specialty;
      let finalLat = formData.lat;
      let finalLng = formData.lng;

      // Smart Geocoding Fallback for applicants who didn't use GPS
      if (!finalLat && !finalLng && formData.location) {
        try {
          const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location + ', India')}&limit=1`);
          const gData = await gRes.json();
          if (gData && gData.length > 0) {
            finalLat = parseFloat(gData[0].lat);
            finalLng = parseFloat(gData[0].lon);
          }
        } catch (e) {}
      }

      try {
        await addDoc(collection(db, 'volunteers'), {
          ...formData,
          lat: finalLat,
          lng: finalLng,
          specialty: finalSpecialty,
          status: 'active', // Set to active so they show on map immediately for now
          rating: 5.0,
          tasks: 0,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          createdAt: serverTimestamp()
        });

        // Send confirmation email to the new helper/volunteer
        const templateParams = {
          to_name: formData.name,
          name: formData.name, // Match {{name}}
          to_email: formData.email,
          email: formData.email, // Match {{email}}
          specialty: finalSpecialty,
          location: formData.location || 'Global Operations',
          bio: formData.bio, // Added bio to notify team
          coords: formData.lat ? `${formData.lat.toFixed(4)}, ${formData.lng?.toFixed(4)}` : 'N/A',
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

          // 2. Alert Admin (New Volunteer Applicant)
          const adminAlertParams = {
            ...templateParams,
            to_name: 'Relay HQ Coordinator',
            to_email: 'resourceflow01@gmail.com',
            admin_email: 'resourceflow01@gmail.com',
            email: 'resourceflow01@gmail.com',
            subject: `NEW VOLUNTEER ENLISTED: ${formData.name} (${finalSpecialty})`,
            alert_type: 'New Volunteer Application'
          };
          
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id', 
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id', 
            adminAlertParams, 
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
          );
        } catch (error) {
          console.error("Volunteer Confirmation Email Error:", error);
        }
        
        alert('Application Received! Our team will verify your credentials and activate your profile soon.');

        navigate('/dashboard');
      } catch (error) {
        console.error("Error adding volunteer: ", error);
        alert('Failed to submit application. Please check your connection.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };



  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const skills = [
    { icon: Stethoscope, name: 'Medical / First Aid' },
    { icon: Truck, name: 'Logistics & Transport' },
    { icon: Utensils, name: 'Food / Supply Distribution' },
    { icon: Heart, name: 'Psychological Support' },
    { icon: Backpack, name: 'Search and Rescue' },
    { icon: ShieldCheck, name: 'Security / Ground Control' },
    { icon: HelpCircle, name: 'Other / Global Support' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Mini-Header */}
      <header className="border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <div className="text-xl font-bold flex items-center">
              <span className="text-[#003875]">Resource</span>
              <span className="text-[#009AE5] italic">Flow</span>
            </div>
          </Link>
          <div className="flex gap-4">
            <span className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-100'}`}></span>
            <span className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></span>
            <span className={`h-2 w-8 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-100'}`}></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Users className="w-16 h-16 text-blue-600 mx-auto mb-4 p-3 bg-blue-50 rounded-2xl" />
          <h1 className="text-3xl font-bold text-gray-900">Become a Certified Responder</h1>
          <p className="text-gray-500 mt-2">Join our global network of heroes using AI for coordinated disaster relief.</p>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h2 className="text-xl font-semibold border-b pb-4">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter your name" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter your email" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="+1 (555) 000-0000" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Location (Base Area)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="City or District" 
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLoc}
                    className={`px-4 rounded-xl border flex items-center justify-center transition-all ${
                      formData.lat ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                    }`}
                    title="Get Current GPS Location"
                  >
                    {gettingLoc ? '...' : formData.lat ? '✓' : <MapPin className="h-5 w-5" />}
                  </button>
                </div>
                {formData.lat && (
                   <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-widest pl-1">GPS Point Locked: {formData.lat.toFixed(4)}, {formData.lng?.toFixed(4)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end pt-8 gap-4">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-12 h-14" onClick={handleNext}>
                Continuing to Skills
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h2 className="text-xl font-semibold border-b pb-4">Select Your Specializations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill, i) => (
                <div 
                  key={i} 
                  onClick={() => updateField('specialty', skill.name)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-4 group ${
                    formData.specialty === skill.name ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg transition-colors ${
                    formData.specialty === skill.name ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-blue-50'
                  }`}>
                    <skill.icon className={`w-6 h-6 ${
                      formData.specialty === skill.name ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                    }`} />
                  </div>
                  <span className={`text-sm font-medium ${
                    formData.specialty === skill.name ? 'text-blue-700 font-bold' : 'text-gray-800'
                  }`}>{skill.name}</span>
                </div>
               ))}
            </div>
            {formData.specialty === 'Other / Global Support' && (
               <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">Define Your Custom Specialty</label>
                  <input 
                    type="text" 
                    value={formData.customSpecialty}
                    onChange={(e) => updateField('customSpecialty', e.target.value)}
                    className="w-full px-6 py-4 bg-blue-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-900" 
                    placeholder="e.g. Drone Pilot, Translator, Engineer..." 
                    required
                  />
               </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between pt-8 gap-4">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-12 h-14" onClick={handleNext}>
                Nearly Finished
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h2 className="text-xl font-semibold border-b pb-4">Verification & Bio</h2>
            <div className="space-y-4">
              <label className="text-sm font-medium">Upload Certifications (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-gray-500">Click or drag and drop your disaster relief ID or Medical license</p>
                <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brief Experience / Bio</label>
                <textarea 
                  rows={4} 
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  placeholder="Tell us about your background in volunteer work..."
                ></textarea>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between pt-8 gap-4">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-12 h-14" onClick={handleNext}>
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 w-5 h-5" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
