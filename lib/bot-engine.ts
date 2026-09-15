import { db } from './db';
import { VisitType, Visit, BotStep, BotSession } from './types';
import { calculateDistanceKm, isDuplicateLocation } from './geo';
import { analyzeFieldPhoto } from './ai-vision';

export interface BotIncomingMessage {
  fromMobile: string;
  body?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  photoUrl?: string;
}

export interface BotResponse {
  replyText: string;
  currentStep: BotStep;
  quickReplies?: string[];
  requiresLocation?: boolean;
  requiresPhoto?: boolean;
  recordedVisit?: Visit;
}

const VISIT_TYPES: Record<string, VisitType> = {
  '1': 'Farmer Visit',
  'farmer visit': 'Farmer Visit',
  'farmer': 'Farmer Visit',
  '2': 'Dealer Visit',
  'dealer visit': 'Dealer Visit',
  'dealer': 'Dealer Visit',
  '3': 'Distributor Visit',
  'distributor visit': 'Distributor Visit',
  'distributor': 'Distributor Visit',
  '4': 'Field Visit',
  'field visit': 'Field Visit',
  'field': 'Field Visit',
  '5': 'Field Program',
  'field program': 'Field Program',
  'program': 'Field Program',
  '6': 'Other',
  'other': 'Other',
};

export async function processIncomingWhatsAppMessage(
  msg: BotIncomingMessage
): Promise<BotResponse> {
  const employee = await db.getEmployeeByMobile(msg.fromMobile);

  // If mobile is not recognized in the Employee Master Database
  if (!employee) {
    return {
      replyText: `⚠️ क्षमा करें, आपका मोबाइल नंबर (${msg.fromMobile}) InnoVeg Employee Master Database में पंजीकृत नहीं है।\n\nकृपया अपने Territory Manager या HR से संपर्क करें।`,
      currentStep: 'START',
    };
  }

  let session = await db.getSession(msg.fromMobile);
  if (!session) {
    session = {
      mobileNumber: msg.fromMobile,
      employeeId: employee.id,
      currentStep: 'START',
      tempVisitData: {},
      lastActive: new Date().toISOString(),
    };
  }

  const text = (msg.body || '').trim();
  const lowerText = text.toLowerCase();

  // Reset or start new visit command anytime
  if (
    lowerText === 'new visit' ||
    lowerText === 'hi' ||
    lowerText === 'hello' ||
    lowerText === 'start' ||
    lowerText === 'namaste' ||
    lowerText === 'restart' ||
    lowerText === 'menu'
  ) {
    session.currentStep = 'SELECT_VISIT_TYPE';
    session.tempVisitData = {};
    await db.saveSession(session);

    return {
      replyText: `नमस्कार ${employee.name.split(' ')[0]} जी 👋\n\nनई Visit दर्ज करने के लिए Visit Type चुनें:\n\n1. Farmer Visit\n2. Dealer Visit\n3. Distributor Visit\n4. Field Visit\n5. Field Program\n6. Other`,
      currentStep: 'SELECT_VISIT_TYPE',
      quickReplies: [
        '1. Farmer Visit',
        '2. Dealer Visit',
        '3. Distributor Visit',
        '4. Field Visit',
        '5. Field Program',
        '6. Other',
      ],
    };
  }

  // State Step 1: Selecting Visit Type
  if (session.currentStep === 'SELECT_VISIT_TYPE') {
    const matchedType = VISIT_TYPES[lowerText] || VISIT_TYPES[text.replace(/^[0-9]\.\s*/, '').toLowerCase()];
    if (!matchedType) {
      return {
        replyText: `कृपया 1 से 6 के बीच मान्य Visit Type चुनें:\n\n1. Farmer Visit\n2. Dealer Visit\n3. Distributor Visit\n4. Field Visit\n5. Field Program\n6. Other`,
        currentStep: 'SELECT_VISIT_TYPE',
        quickReplies: [
          '1. Farmer Visit',
          '2. Dealer Visit',
          '3. Distributor Visit',
          '4. Field Visit',
          '5. Field Program',
          '6. Other',
        ],
      };
    }

    session.tempVisitData.visitType = matchedType;
    session.currentStep = 'COLLECT_DETAILS';
    await db.saveSession(session);

    let detailPrompt = '';
    if (matchedType === 'Dealer Visit' || matchedType === 'Distributor Visit') {
      detailPrompt = `📝 **${matchedType} Selected**\n\nकृपया Dealer का नाम और Village/Town भेजें।\n\nउदाहरण: *Shiv Shakti Krishi Kendra, Multai*`;
    } else if (matchedType === 'Farmer Visit') {
      detailPrompt = `📝 **Farmer Visit Selected**\n\nकृपया Farmer का नाम और Village भेजें।\n\nउदाहरण: *Rameshwar Patel, Dunawa*`;
    } else if (matchedType === 'Field Program') {
      detailPrompt = `📝 **Field Program Selected**\n\nकृपया Program का नाम/विषय और Village भेजें।\n\nउदाहरण: *Farmer Group Demonstration, Masod*`;
    } else {
      detailPrompt = `📝 **${matchedType} Selected**\n\nकृपया Visit Details और Village/स्थान का नाम भेजें।`;
    }

    return {
      replyText: detailPrompt,
      currentStep: 'COLLECT_DETAILS',
    };
  }

  // State Step 2: Collecting Entity Details & Village
  if (session.currentStep === 'COLLECT_DETAILS') {
    if (!text || text.length < 3) {
      return {
        replyText: `कृपया सही नाम और गाँव/स्थान भेजें।\n\nउदाहरण: *Shiv Shakti Krishi Kendra, Multai*`,
        currentStep: 'COLLECT_DETAILS',
      };
    }

    const parts = text.split(',');
    const entityName = parts[0].trim();
    const village = parts.length > 1 ? parts.slice(1).join(',').trim() : employee.territory;

    session.tempVisitData.entityName = entityName;
    session.tempVisitData.village = village;
    session.currentStep = 'COLLECT_LOCATION';
    await db.saveSession(session);

    return {
      replyText: `📍 कृपया अपनी Current GPS Location भेजें।\n\n*(WhatsApp Location अटैचमेंट शेयर करें)*`,
      currentStep: 'COLLECT_LOCATION',
      requiresLocation: true,
    };
  }

  // State Step 3: Collecting GPS Location
  if (session.currentStep === 'COLLECT_LOCATION') {
    let lat: number | undefined;
    let lng: number | undefined;
    let locationName = session.tempVisitData.village || employee.territory;

    if (msg.location) {
      lat = msg.location.latitude;
      lng = msg.location.longitude;
      if (msg.location.name) locationName = msg.location.name;
    } else if (text.includes(',') && !isNaN(Number(text.split(',')[0]))) {
      const parts = text.split(',');
      lat = parseFloat(parts[0]);
      lng = parseFloat(parts[1]);
    }

    if (!lat || !lng) {
      return {
        replyText: `⚠️ लोकेशन प्राप्त नहीं हुई। कृपया WhatsApp से अपनी 📍 Current Location भेजें या Latitude, Longitude लिखें (जैसे 21.7709, 78.2575)।`,
        currentStep: 'COLLECT_LOCATION',
        requiresLocation: true,
      };
    }

    session.tempVisitData.latitude = lat;
    session.tempVisitData.longitude = lng;
    session.tempVisitData.locationName = locationName;
    session.currentStep = 'COLLECT_PHOTO';
    await db.saveSession(session);

    return {
      replyText: `📍 लोकेशन प्राप्त हुई: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\n📷 अब Visit की Live Photo भेजें।`,
      currentStep: 'COLLECT_PHOTO',
      requiresPhoto: true,
    };
  }

  // State Step 4: Collecting Live Photo
  if (session.currentStep === 'COLLECT_PHOTO') {
    const photoUrl = msg.photoUrl || (text.startsWith('http') ? text : undefined);

    if (!photoUrl) {
      return {
        replyText: `📷 कृपया Visit की फ़ोटो अपलोड करें।\n\n(कैमरे से लाइव फ़ोटो भेजें या इमेज लिंक शेयर करें)`,
        currentStep: 'COLLECT_PHOTO',
        requiresPhoto: true,
      };
    }

    session.tempVisitData.photoUrl = photoUrl;
    session.currentStep = 'COLLECT_REMARKS';
    await db.saveSession(session);

    return {
      replyText: `📷 फ़ोटो प्राप्त हो गई है!\n\nVisit के बारे में कोई Remark, Farmer Requirement या Booking हो तो लिखें।\n\n(यदि कोई जानकारी नहीं है तो *Skip* भेजें)`,
      currentStep: 'COLLECT_REMARKS',
      quickReplies: ['Skip', 'Booking Confirmed', 'Farmer Satisfied', 'Payment Follow-up'],
    };
  }

  // State Step 5: Remarks / Booking & Finalizing Visit
  if (session.currentStep === 'COLLECT_REMARKS') {
    const remarks = lowerText === 'skip' ? 'No specific remarks' : text;
    session.tempVisitData.remarksBooking = remarks;

    // Retrieve previous visits today to calculate route distance & duplicate location check
    const todayVisits = await db.getTodayVisitsByEmployee(employee.id);
    const lastVisit = todayVisits.length > 0 ? todayVisits[0] : undefined;

    const lat = session.tempVisitData.latitude || 21.7709;
    const lng = session.tempVisitData.longitude || 78.2575;

    let distanceFromPrev = 0;
    if (lastVisit) {
      distanceFromPrev = calculateDistanceKm(lastVisit.latitude, lastVisit.longitude, lat, lng);
    }

    // Check if location is duplicate (<150m of previous visits in last 7 days)
    const allEmpVisits = await db.getVisitsByEmployee(employee.id);
    const isRepeat = isDuplicateLocation(lat, lng, allEmpVisits, 150);

    // Run AI Vision analysis on photo
    const photoUrl =
      session.tempVisitData.photoUrl ||
      'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80';

    const aiResult = await analyzeFieldPhoto(
      photoUrl,
      session.tempVisitData.visitType || 'Dealer Visit',
      session.tempVisitData.entityName || 'Visit Point'
    );

    const newVisit: Visit = {
      id: `v-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeMobile: employee.mobileNumber,
      district: employee.district,
      territory: employee.territory,
      visitType: session.tempVisitData.visitType || 'Dealer Visit',
      entityName: session.tempVisitData.entityName || 'Entity',
      village: session.tempVisitData.village || employee.territory,
      latitude: lat,
      longitude: lng,
      locationName: session.tempVisitData.locationName || `${session.tempVisitData.village}, ${employee.district}`,
      photoUrl: photoUrl,
      remarksBooking: remarks,
      isRepeatLocation: isRepeat,
      distanceFromPrevKm: distanceFromPrev,
      aiAnalysis: aiResult,
      timestamp: new Date().toISOString(),
    };

    await db.addVisit(newVisit);

    // Clear session for next visit
    await db.clearSession(msg.fromMobile);

    const totalTodayCount = todayVisits.length + 1;
    const target = employee.dailyVisitTarget;
    const remaining = Math.max(0, target - totalTodayCount);

    let targetMsg = '';
    if (remaining === 0) {
      targetMsg = `🎉 **बधाई हो! आज का Daily Target (${target} Visits) पूरा हो गया है!**`;
    } else {
      targetMsg = `आज का Target पूरा करने के लिए **${remaining} Visits** बाकी हैं।`;
    }

    const reply = `✅ **Visit Successfully Recorded**

👤 **Employee:** ${employee.name}
🏢 **Visit Type:** ${newVisit.visitType}
📍 **Location:** ${newVisit.village} (${isRepeat ? '⚠️ Repeat Location' : '✨ Unique Location'})
📊 **Today's Visits:** ${totalTodayCount}
🎯 **Daily Target:** ${target}

${targetMsg}

AI Quality Score: ${aiResult.qualityScore}/100 ${aiResult.isBlur ? '(⚠️ Blurry)' : '✨'}

अगली विजिट दर्ज करने के लिए कभी भी **New Visit** भेजें।`;

    return {
      replyText: reply,
      currentStep: 'CONFIRMED',
      recordedVisit: newVisit,
      quickReplies: ['New Visit', 'My Summary Today'],
    };
  }

  return {
    replyText: `नई Visit दर्ज करने के लिए **New Visit** लिखें या 1 से 6 चुनें।`,
    currentStep: 'START',
    quickReplies: ['New Visit'],
  };
}
