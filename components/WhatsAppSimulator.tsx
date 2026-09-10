'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Employee, Visit } from '@/lib/types';
import {
  X,
  Send,
  MapPin,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Phone,
  MoreVertical,
  Paperclip,
  CheckCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  location?: { latitude: number; longitude: number; name?: string };
  photoUrl?: string;
  isConfirmed?: boolean;
}

interface WhatsAppSimulatorProps {
  employees: Employee[];
  onClose: () => void;
  onVisitCreated: (visit: Visit) => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  employees,
  onClose,
  onVisitCreated,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || 'emp-1');
  const currentOfficer = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting when opening or switching officer
  useEffect(() => {
    if (!currentOfficer) return;
    setMessages([
      {
        id: 'msg-init-bot',
        sender: 'bot',
        text: `नमस्कार ${currentOfficer.name.split(' ')[0]} जी 👋 (InnoVeg Reporting Bot)\n\nनई Visit दर्ज करने के लिए **New Visit** लिखें या नीचे से Visit Type चुनें:\n\n1. Farmer Visit\n2. Dealer Visit\n3. Distributor Visit\n4. Field Visit\n5. Field Program\n6. Other`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          '1. Farmer Visit',
          '2. Dealer Visit',
          '3. Distributor Visit',
          '4. Field Visit',
          '5. Field Program',
          '6. Other',
        ],
      },
    ]);
  }, [selectedEmpId]);

  const sendMessage = async (
    textToSend?: string,
    locationData?: { latitude: number; longitude: number; name?: string },
    photoUrlData?: string
  ) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim();
    if (!text && !locationData && !photoUrlData) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      location: locationData,
      photoUrl: photoUrlData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setShowLocationPicker(false);
    setShowPhotoPicker(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromMobile: currentOfficer.mobileNumber,
          message: text,
          location: locationData,
          photoUrl: photoUrlData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.replyText,
          quickReplies: data.quickReplies,
          isConfirmed: data.currentStep === 'CONFIRMED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMsg]);

        if (data.recordedVisit) {
          onVisitCreated(data.recordedVisit);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    await fetch('/api/whatsapp/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromMobile: currentOfficer.mobileNumber,
        message: 'restart',
        resetSession: true,
      }),
    });

    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: `नमस्कार ${currentOfficer.name.split(' ')[0]} जी 👋\n\nनई Visit दर्ज करने के लिए Visit Type चुनें:\n\n1. Farmer Visit\n2. Dealer Visit\n3. Distributor Visit\n4. Field Visit\n5. Field Program\n6. Other`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          '1. Farmer Visit',
          '2. Dealer Visit',
          '3. Distributor Visit',
          '4. Field Visit',
          '5. Field Program',
          '6. Other',
        ],
      },
    ]);
  };

  // Sample quick GPS presets for convenience
  const sampleLocations = [
    { name: 'Multai Market Yard', lat: 21.7709, lng: 78.2575 },
    { name: 'Dunawa Farmland', lat: 21.7345, lng: 78.4123 },
    { name: 'Masod Village Center', lat: 21.6512, lng: 78.3411 },
    { name: 'Warud Agro Hub', lat: 21.4655, lng: 78.2678 },
  ];

  // Sample photo presets
  const samplePhotos = [
    {
      label: 'Dealer Counter & Branding',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Farmer in Vegetable Field',
      url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Farmer Group Demonstration',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Chilli Crop Plot Inspection',
      url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-3xl w-full max-w-md h-[88vh] max-h-[780px] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-700 animate-in fade-in zoom-in-95 relative">
        {/* Officer Switcher Bar */}
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 flex-1 mr-2">
            <span className="text-[11px] text-slate-400">Officer:</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-slate-700 text-white rounded px-2 py-0.5 text-xs font-medium border border-slate-600 focus:outline-none flex-1 truncate"
            >
              {employees.slice(0, 20).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.district} - {emp.mobileNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Reset Chat Session"
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Phone Header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow-inner">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-sm leading-tight">InnoVeg Field Bot</h3>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <p className="text-[11px] text-emerald-200">Official Reporting System • Online</p>
            </div>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div
          className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#E5DDD5]"
          style={{
            backgroundImage:
              'radial-gradient(#d5cdc5 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 shadow-sm text-xs relative ${
                    isUser
                      ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/50'
                  }`}
                >
                  {/* Photo if sent */}
                  {msg.photoUrl && (
                    <div className="rounded-md overflow-hidden mb-1.5 border border-slate-200/60 max-h-40">
                      <img
                        src={msg.photoUrl}
                        alt="Submitted"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location Pin preview if sent */}
                  {msg.location && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded border border-emerald-200 mb-1.5 text-emerald-900 font-medium">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">{msg.location.name || 'GPS Location Pin'}</p>
                        <p className="text-[10px] text-emerald-700 font-mono">
                          {msg.location.latitude.toFixed(4)}, {msg.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Text Message with formatted newlines */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Timestamp & Double Checkmarks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                </div>

                {/* Quick Reply Buttons if provided by Bot */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[90%]">
                    {msg.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(reply)}
                        disabled={isLoading}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full shadow-sm active:scale-95 transition-transform"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs text-slate-500 w-fit shadow-sm border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>InnoVeg Bot is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Location Picker Drawer */}
        {showLocationPicker && (
          <div className="p-3 bg-white border-t border-slate-200 space-y-2 text-xs animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Share GPS Location Pin
              </span>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {sampleLocations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() =>
                    sendMessage(
                      undefined,
                      { latitude: loc.lat, longitude: loc.lng, name: loc.name }
                    )
                  }
                  className="p-2 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <p className="font-bold text-[11px] text-slate-900">{loc.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {loc.lat}, {loc.lng}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Picker Drawer */}
        {showPhotoPicker && (
          <div className="p-3 bg-white border-t border-slate-200 space-y-2 text-xs animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-indigo-600" /> Send Live Field Photo
              </span>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {samplePhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(undefined, undefined, photo.url)}
                  className="p-1 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg group"
                >
                  <div className="h-16 rounded overflow-hidden mb-1">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="font-semibold text-[10px] text-slate-800 truncate">
                    {photo.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowLocationPicker(!showLocationPicker);
              setShowPhotoPicker(false);
            }}
            title="Share Location"
            className={`p-2 rounded-full transition-colors ${
              showLocationPicker ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setShowPhotoPicker(!showPhotoPicker);
              setShowLocationPicker(false);
            }}
            title="Attach Photo"
            className={`p-2 rounded-full transition-colors ${
              showPhotoPicker ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type a message or choice..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            className="flex-1 px-3 py-2 bg-white rounded-full text-xs text-slate-900 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="p-2 bg-[#128C7E] hover:bg-[#075E54] active:scale-95 disabled:opacity-40 text-white rounded-full transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
