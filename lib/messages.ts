import { plural, type Locale } from "./i18n";
import type { GuestStatus } from "./types";

// All interface text, in English and Arabic. Arabic is the source of truth for
// its own phrasing (not a word-for-word translation), and counts go through
// plural() because Arabic has dual and few/many forms.

const en = {
  brand: { name: "Occasion", initial: "O" },
  language: { switchTo: "العربية", label: "Language" },

  nav: {
    events: "Events",
    newEvent: "New event",
    billing: "Billing",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    admin: "Admin — sees all events",
    promoTitle: "Invites go out on WhatsApp",
    promoBody: "Guests reply with one tap, and get their entry pass instantly.",
  },
  demoBanner: {
    strong: "Demo sign-in is on.",
    body: "WhatsApp isn't connected yet, so sign-in codes are shown on screen — anyone can sign in with any number until it is.",
  },

  greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
  countdown: (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 1) return days < 60 ? `In ${days} days` : `In ${Math.round(days / 30)} months`;
    return `${-days} days ago`;
  },

  status: {
    accepted: "Coming",
    declined: "Can't make it",
    pending: "Not sent yet",
    no_response: "Waiting to hear",
    invalid: "Number issue",
  } satisfies Record<GuestStatus, string>,
  // Announcement-style occasions (condolences) have no replies.
  statusNoRsvp: { no_response: "Notified", pending: "Not sent yet", invalid: "Number issue" },

  dashboard: {
    nextIn: "Your next occasion is",
    today: "You have an occasion today",
    empty: "Let's plan something lovely",
    newEvent: "New event",
    noEventsTitle: "No events yet",
    noEventsBody: "Create your first event, add your guests, and we'll send beautiful WhatsApp invitations for you.",
    createFirst: "Create your first event",
    invited: "Guests invited",
    coming: "Coming",
    waiting: "Waiting to hear",
    upcoming: "Upcoming",
    past: "Past events",
    noGuests: "No guests yet",
    replied: (coming: number, replied: number, total: number) => `${coming} coming · ${replied} of ${total} replied`,
    notified: (n: number) => `${n} notified`,
  },

  event: {
    allEvents: "All events",
    replied: (replied: number, total: number) => `${replied} of ${total} guests have replied`,
    notifiedOf: (notified: number, total: number) => `${notified} of ${total} guests have been notified`,
    notFound: "We couldn't find this event — it may have been removed.",
    loadFailed: (status: number) => `Something went wrong loading this event (${status}).`,
    oops: "Hmm, that didn't work",
    back: "Back to your events",
    addGuests: "Add guests",
    addGuestsBody: "Each new guest gets a personal WhatsApp invitation straight away.",
    orUpload: "or upload a whole list",
    guestList: "Guest list",
    retryUnsent: (n: number) => `Retry ${n} unsent`,
    retrying: "Retrying…",
    whatGuestsReceive: "What guests receive",
    invitationLanguage: (lang: string) => `Invitations in ${lang}`,
    noRsvpNote: "This is an announcement, so guests aren't asked to reply and no reminders are sent.",
  },

  stats: { notified: "Notified", notSent: "Not sent yet", numberIssue: "Number issue" },

  guests: {
    everyone: "Everyone",
    waiting: "Waiting",
    search: "Search guests",
    noMatch: "No guests match that.",
    emptyTitle: "Your guest list is empty",
    emptyBody: "Add guests above, one by one or from an Excel file. Invitations go out right away.",
    markComing: "Coming",
    markNotComing: "Not coming",
    recordReplyHint: "Record a reply yourself, e.g. if the guest called you",
    fixNumber: "Fix number",
    edit: (name: string) => `Edit ${name}`,
    remove: (name: string) => `Remove ${name}`,
    name: "Name",
    phone: "Mobile number",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    newNumberHint: "A new number gets a fresh invitation on WhatsApp straight away.",
    confirmPhoneChange: (name: string) =>
      `${name} has already replied. Changing their number clears that reply and sends a new invitation to the new number. Continue?`,
    confirmRemove: (name: string) => `Remove ${name} from the guest list? This can't be undone.`,
    entryPass: "Entry pass code",
    errors: {
      invalidNumber: "Check this number — it looks wrong or isn't on WhatsApp",
      rateLimited: "WhatsApp was busy — try sending again shortly",
      templateError: "The message template needs attention in WhatsApp Manager",
      barcodeFailed: "Their entry pass didn't send",
      reminderFailed: "Their last reminder didn't send",
      network: "Couldn't reach WhatsApp — try again",
      generic: "Last message didn't send",
    },
  },

  upload: {
    drop: "Drop your Excel guest list here, or click to choose",
    sending: "Sending invitations…",
    help: "Two columns: Name and Mobile number. Local numbers like 05… are fine, and guests already on your list are skipped.",
    template: "Download the Excel template",
    sent: (n: number, festive: boolean) => `${n === 1 ? "1 invitation" : `${n} invitations`} on their way${festive ? " 🎉" : ""}`,
    added: (n: number) => (n === 1 ? "Added 1 guest" : `Added ${n} guests`),
    noneAdded: "No new guests added",
    needChecking: (n: number) => (n === 1 ? "1 number needs checking" : `${n} numbers need checking`),
    didntSend: (n: number) => `${n} didn't send yet — use "Retry" below`,
    duplicates: (n: number) => `${n} already on your list, skipped`,
    missing: (n: number) => (n === 1 ? "1 row missing a name or number, skipped" : `${n} rows missing a name or number, skipped`),
    xls: "That's an older Excel format (.xls). In Excel choose File → Save As → Excel Workbook (.xlsx), then upload again.",
    wrongType: "Please upload an Excel file (.xlsx). CSV files work too.",
    noGuests: "We couldn't find any guests in that file. Each row needs a name and a mobile number.",
    unreadable: "We couldn't read that file. Try saving it again as .xlsx.",
  },

  addGuest: {
    name: "Guest name",
    namePlaceholder: "Layla Al-Otaibi",
    phone: "Mobile number",
    submit: "Add & invite",
    adding: "Adding…",
    bothRequired: "Please enter both a name and a mobile number.",
    duplicate: "That number is already on your guest list.",
    sent: (name: string, festive: boolean) => `Invitation sent to ${name}${festive ? " 🎉" : ""}`,
    invalid: (name: string) => `${name} was added, but that number doesn't look right — you can fix it in the list below.`,
    notSent: (name: string) => `${name} was added, but the invitation didn't send yet — use "Retry" below.`,
  },

  reminders: {
    title: "Reminders",
    subtitle: (n: number) => `Sent automatically on WhatsApp to the ${n === 1 ? "1 guest who is" : `${n} guests who are`} coming.`,
    week: "One week before",
    day: "On the day",
    sentAt: (when: string) => `Sent ${when}`,
    dueNow: "Going out with the next daily send",
    scheduledFor: (date: string) => `Scheduled for ${date}`,
    sendNow: "Send now",
    resend: "Resend",
    sending: "Sending…",
    confirmResend: "This reminder was already sent. Send it to everyone who's coming again?",
    noOne: "Nobody has said they're coming yet, so there was no one to remind.",
    sentTo: (sent: number, failed: number) => `Reminder sent to ${sent === 1 ? "1 guest" : `${sent} guests`}${failed ? ` — ${failed} didn't go through` : ""}.`,
  },

  billing: {
    costSoFar: "Cost so far",
    status: { draft: "Draft", issued: "Issued", paid: "Paid" },
    conversations: (n: number, rate: string) => `${n === 1 ? "1 WhatsApp conversation" : `${n} WhatsApp conversations`} × ${rate}`,
    issue: "Issue invoice",
    issuing: "Issuing…",
    issuedOn: (date: string) => `Invoice issued ${date}`,
    eyebrow: "Billing",
    title: "What your invitations cost",
    subtitle: "You only pay for the WhatsApp conversations your events actually use — invites, reminders, and entry passes.",
    total: "Total across all events",
    notInvoiced: "Not yet invoiced",
    conversationsTotal: "WhatsApp conversations",
    byEvent: "By event",
    empty: "Nothing to bill yet — costs appear here once invitations go out.",
    conversationCount: (n: number) => (n === 1 ? "1 conversation" : `${n} conversations`),
  },

  newEvent: {
    eyebrow: "New event",
    title: "What's the occasion?",
    stepOccasion: "The occasion",
    stepDetails: "The details",
    stepDetailsHint: "These appear on every invitation.",
    stepDesign: "Pick a card design",
    stepDesignHint: "You can see how it looks in the preview.",
    name: "Event name",
    date: "Date",
    venue: "Venue",
    optional: "(optional)",
    venuePlaceholder: "Ritz-Carlton, Jeddah",
    inviteLanguage: "Invitation language",
    inviteLanguageHint: "The card and WhatsApp messages your guests receive.",
    required: "Almost there — please add the event name, date, and host.",
    next: "Next, you'll add your guests.",
    create: "Create event",
    creating: "Creating…",
    preview: "Live preview",
    noDesigns: "No card designs for this occasion yet — we'll use our classic design.",
    designs: "Card design",
  },

  login: {
    welcome: "Welcome 👋",
    intro: "Sign in with your mobile number to see your events. We'll send you a code on WhatsApp.",
    phone: "Mobile number",
    phoneHelp: "Saudi numbers can start with 05. For other countries, include the + code.",
    sendCode: "Send me a code",
    sending: "Sending…",
    changeNumber: "Change number",
    checkWhatsApp: "Check your WhatsApp",
    sentTo: "We sent a 6-digit code to",
    demoCode: "WhatsApp isn't connected yet, so here's your code:",
    code: "Code",
    signIn: "Sign in",
    checking: "Checking…",
    resendIn: (s: number) => `Send a new code in ${s}s`,
    resend: "Send a new code",
  },

  // The card and WhatsApp preview, in the event's invitation language.
  card: {
    to: (name: string) => `Dear ${name},`,
    message: (name: string, event: string, venue: string) =>
      `Hi ${name}! You're invited to ${event}${venue ? ` at ${venue}` : ""}. Will you be joining us?`,
    announcement: (name: string, event: string, venue: string) =>
      `Dear ${name}, ${event}${venue ? ` — at ${venue}` : ""}. May Allah have mercy on the deceased.`,
    accept: "Accept",
    decline: "Decline",
    sampleGuest: "Layla",
    eventFallback: "Your event name",
  },

  errors: {
    network: "Network error — check your connection and try again.",
    requestFailed: (status: number) => `Request failed (${status})`,
    invalidBody: "Something was wrong with that request. Please try again.",
    signInAgain: "Please sign in again.",
    missingFields: "Please add the event name, date, and host.",
    invalidOccasion: "Please choose an occasion.",
    invalidDate: "Please choose a valid date.",
    templateMismatch: "That card design doesn't match the occasion.",
    eventNotFound: "Event not found",
    guestNotFound: "Guest not found",
    notFound: "Not found",
    enterPhone: "Please enter your mobile number.",
    invalidPhone: "That doesn't look like a valid mobile number.",
    codeTooSoon: (s: number) => `We just sent you a code. You can ask for a new one in ${s}s.`,
    codeSendFailed: "We couldn't send a code to that number on WhatsApp. Please try again.",
    enterCode: "Please enter the 6-digit code.",
    wrongCode: "That code isn't right or has expired. Check it, or ask for a new one.",
    addAtLeastOne: "Please add at least one guest.",
    noGuestsFound: "We couldn't find any guests. Each row needs a name and a mobile number.",
    tooMany: (n: number, max: number) => `Too many guests (${n}). Add at most ${max} at a time.`,
    enterName: "Please enter the guest's name.",
    duplicatePhone: "Another guest on this event already has that number.",
    nothingToUpdate: "Nothing to update.",
    invalidDecision: "Please choose Coming or Not coming.",
    guestNotInvitable: "This guest has a number issue and was never invited — fix their number first.",
    noRsvp: "Guests aren't asked to reply for this occasion.",
    noReminders: "Reminders aren't sent for this occasion.",
    reminderKind: "Please choose which reminder to send.",
    reminderAlreadySent: "This reminder was already sent.",
    invoiceAlready: (status: string) => `The invoice is already ${status.toLowerCase()}.`,
  },
};

export type Messages = typeof en;

// "N guests" with the right Arabic number agreement.
const guestsAr = (n: number) => plural("ar", n, { one: "ضيف واحد", two: "ضيفين", few: "{n} ضيوف", many: "{n} ضيفاً", other: "{n} ضيف" });

const ar: Messages = {
  brand: { name: "مناسبة", initial: "م" },
  language: { switchTo: "English", label: "اللغة" },

  nav: {
    events: "المناسبات",
    newEvent: "مناسبة جديدة",
    billing: "الفواتير",
    signOut: "تسجيل الخروج",
    signedInAs: "مسجّل الدخول برقم",
    admin: "مشرف — يرى جميع المناسبات",
    promoTitle: "الدعوات تصل عبر واتساب",
    promoBody: "يرد الضيوف بلمسة واحدة، ويستلمون بطاقة الدخول فوراً.",
  },
  demoBanner: {
    strong: "وضع التجربة مفعّل.",
    body: "لم يتم ربط واتساب بعد، لذلك تظهر رموز الدخول على الشاشة — ويمكن لأي شخص الدخول بأي رقم حتى يتم الربط.",
  },

  greeting: { morning: "صباح الخير", afternoon: "مساء الخير", evening: "مساء الخير" },
  countdown: (days: number) => {
    if (days === 0) return "اليوم";
    if (days === 1) return "غداً";
    if (days === -1) return "أمس";
    if (days > 1) {
      if (days >= 60) {
        const months = Math.round(days / 30);
        return `بعد ${plural("ar", months, { two: "شهرين", few: "{n} أشهر", many: "{n} شهراً", other: "{n} شهر" })}`;
      }
      return `بعد ${plural("ar", days, { two: "يومين", few: "{n} أيام", many: "{n} يوماً", other: "{n} يوم" })}`;
    }
    return `قبل ${plural("ar", -days, { two: "يومين", few: "{n} أيام", many: "{n} يوماً", other: "{n} يوم" })}`;
  },

  status: {
    accepted: "سيحضر",
    declined: "معتذر",
    pending: "لم تُرسل بعد",
    no_response: "بانتظار الرد",
    invalid: "مشكلة في الرقم",
  },
  statusNoRsvp: { no_response: "تم الإبلاغ", pending: "لم تُرسل بعد", invalid: "مشكلة في الرقم" },

  dashboard: {
    nextIn: "مناسبتك القادمة",
    today: "لديك مناسبة اليوم",
    empty: "لنخطط لمناسبة جميلة",
    newEvent: "مناسبة جديدة",
    noEventsTitle: "لا توجد مناسبات بعد",
    noEventsBody: "أنشئ مناسبتك الأولى، وأضف ضيوفك، وسنرسل لهم دعوات أنيقة عبر واتساب.",
    createFirst: "أنشئ مناسبتك الأولى",
    invited: "الضيوف المدعوون",
    coming: "سيحضرون",
    waiting: "بانتظار الرد",
    upcoming: "القادمة",
    past: "المناسبات السابقة",
    noGuests: "لا يوجد ضيوف بعد",
    // Verb-first, so the verb stays singular whatever the count.
    replied: (coming: number, replied: number, total: number) => `سيحضر ${coming} · رد ${replied} من ${total}`,
    notified: (n: number) => `تم إبلاغ ${n}`,
  },

  event: {
    allEvents: "كل المناسبات",
    replied: (replied: number, total: number) => `رد ${replied} من أصل ${guestsAr(total)}`,
    notifiedOf: (notified: number, total: number) => `تم إبلاغ ${notified} من أصل ${guestsAr(total)}`,
    notFound: "لم نجد هذه المناسبة — ربما تم حذفها.",
    loadFailed: (status: number) => `حدث خطأ أثناء تحميل المناسبة (${status}).`,
    oops: "عذراً، حدث خطأ",
    back: "العودة إلى مناسباتك",
    addGuests: "أضف الضيوف",
    addGuestsBody: "يستلم كل ضيف جديد دعوة شخصية عبر واتساب فوراً.",
    orUpload: "أو ارفع قائمة كاملة",
    guestList: "قائمة الضيوف",
    retryUnsent: (n: number) => `إعادة إرسال ${n} لم تُرسل`,
    retrying: "جارٍ الإرسال…",
    whatGuestsReceive: "ما يصل إلى الضيوف",
    invitationLanguage: (lang: string) => `الدعوات باللغة ${lang}`,
    noRsvpNote: "هذه المناسبة إعلان، لذلك لا يُطلب من الضيوف الرد ولا تُرسل تذكيرات.",
  },

  stats: { notified: "تم الإبلاغ", notSent: "لم تُرسل بعد", numberIssue: "مشكلة في الرقم" },

  guests: {
    everyone: "الجميع",
    waiting: "بانتظار الرد",
    search: "ابحث عن ضيف",
    noMatch: "لا يوجد ضيوف مطابقون.",
    emptyTitle: "قائمة الضيوف فارغة",
    emptyBody: "أضف الضيوف من الأعلى، واحداً تلو الآخر أو من ملف إكسل. تُرسل الدعوات فوراً.",
    markComing: "سيحضر",
    markNotComing: "معتذر",
    recordReplyHint: "سجّل رد الضيف بنفسك، مثلاً إذا اتصل بك",
    fixNumber: "تصحيح الرقم",
    edit: (name: string) => `تعديل ${name}`,
    remove: (name: string) => `حذف ${name}`,
    name: "الاسم",
    phone: "رقم الجوال",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    newNumberHint: "عند تغيير الرقم تُرسل دعوة جديدة عبر واتساب فوراً.",
    confirmPhoneChange: (name: string) => `${name} رد على الدعوة مسبقاً. تغيير الرقم سيحذف رده ويرسل دعوة جديدة إلى الرقم الجديد. هل تريد المتابعة؟`,
    confirmRemove: (name: string) => `حذف ${name} من قائمة الضيوف؟ لا يمكن التراجع عن ذلك.`,
    entryPass: "رمز بطاقة الدخول",
    errors: {
      invalidNumber: "تحقق من الرقم — يبدو غير صحيح أو غير مسجل في واتساب",
      rateLimited: "واتساب مشغول حالياً — حاول الإرسال بعد قليل",
      templateError: "قالب الرسالة يحتاج إلى مراجعة في مدير واتساب",
      barcodeFailed: "لم تُرسل بطاقة الدخول",
      reminderFailed: "لم يُرسل آخر تذكير",
      network: "تعذر الاتصال بواتساب — حاول مرة أخرى",
      generic: "لم تُرسل آخر رسالة",
    },
  },

  upload: {
    drop: "اسحب ملف إكسل لقائمة الضيوف هنا، أو اضغط للاختيار",
    sending: "جارٍ إرسال الدعوات…",
    help: "عمودان: الاسم ورقم الجوال. الأرقام المحلية مثل 05… مقبولة، ويتم تجاهل الضيوف الموجودين مسبقاً.",
    template: "تنزيل قالب إكسل",
    sent: (n: number, festive: boolean) =>
      `${plural("ar", n, { one: "أُرسلت دعوة واحدة", two: "أُرسلت دعوتان", few: "أُرسلت {n} دعوات", many: "أُرسلت {n} دعوة", other: "أُرسلت {n} دعوة" })}${festive ? " 🎉" : ""}`,
    added: (n: number) => plural("ar", n, { one: "أُضيف ضيف واحد", two: "أُضيف ضيفان", few: "أُضيف {n} ضيوف", many: "أُضيف {n} ضيفاً", other: "أُضيف {n} ضيف" }),
    noneAdded: "لم يُضف أي ضيف جديد",
    needChecking: (n: number) =>
      plural("ar", n, { one: "رقم واحد يحتاج إلى مراجعة", two: "رقمان يحتاجان إلى مراجعة", few: "{n} أرقام تحتاج إلى مراجعة", many: "{n} رقماً يحتاج إلى مراجعة", other: "{n} رقم يحتاج إلى مراجعة" }),
    didntSend: (n: number) => `لم تُرسل ${n} بعد — استخدم «إعادة الإرسال» بالأسفل`,
    duplicates: (n: number) => `${n} موجود مسبقاً في القائمة، تم تجاهله`,
    missing: (n: number) => `${n} صف بدون اسم أو رقم، تم تجاهله`,
    xls: "هذا ملف إكسل بصيغة قديمة (.xls). من إكسل اختر ملف ← حفظ باسم ← مصنف Excel (.xlsx) ثم ارفعه مرة أخرى.",
    wrongType: "يرجى رفع ملف إكسل (.xlsx). ملفات CSV مقبولة أيضاً.",
    noGuests: "لم نجد أي ضيوف في هذا الملف. يجب أن يحتوي كل صف على اسم ورقم جوال.",
    unreadable: "تعذرت قراءة الملف. جرّب حفظه مرة أخرى بصيغة .xlsx.",
  },

  addGuest: {
    name: "اسم الضيف",
    namePlaceholder: "ليلى العتيبي",
    phone: "رقم الجوال",
    submit: "إضافة وإرسال الدعوة",
    adding: "جارٍ الإضافة…",
    bothRequired: "يرجى إدخال الاسم ورقم الجوال.",
    duplicate: "هذا الرقم موجود مسبقاً في قائمة الضيوف.",
    sent: (name: string, festive: boolean) => `أُرسلت الدعوة إلى ${name}${festive ? " 🎉" : ""}`,
    invalid: (name: string) => `تمت إضافة ${name}، لكن الرقم لا يبدو صحيحاً — يمكنك تصحيحه في القائمة بالأسفل.`,
    notSent: (name: string) => `تمت إضافة ${name}، لكن الدعوة لم تُرسل بعد — استخدم «إعادة الإرسال» بالأسفل.`,
  },

  reminders: {
    title: "التذكيرات",
    // "Everyone who confirmed" keeps the verb singular whatever the count.
    subtitle: (n: number) => `تُرسل تلقائياً عبر واتساب لكل من أكّد حضوره (${n}).`,
    week: "قبل أسبوع",
    day: "يوم المناسبة",
    sentAt: (when: string) => `أُرسل ${when}`,
    dueNow: "سيُرسل مع الإرسال اليومي القادم",
    scheduledFor: (date: string) => `مجدول في ${date}`,
    sendNow: "أرسل الآن",
    resend: "أعد الإرسال",
    sending: "جارٍ الإرسال…",
    confirmResend: "تم إرسال هذا التذكير مسبقاً. هل تريد إرساله مرة أخرى لكل المؤكدين حضورهم؟",
    noOne: "لم يؤكد أحد حضوره بعد، لذلك لم يُرسل أي تذكير.",
    sentTo: (sent: number, failed: number) =>
      `أُرسل التذكير إلى ${plural("ar", sent, { one: "ضيف واحد", two: "ضيفين", few: "{n} ضيوف", many: "{n} ضيفاً", other: "{n} ضيف" })}${failed ? ` — تعذر الإرسال إلى ${failed}` : ""}.`,
  },

  billing: {
    costSoFar: "التكلفة حتى الآن",
    status: { draft: "مسودة", issued: "صادرة", paid: "مدفوعة" },
    conversations: (n: number, rate: string) =>
      `${plural("ar", n, { one: "محادثة واتساب واحدة", two: "محادثتا واتساب", few: "{n} محادثات واتساب", many: "{n} محادثة واتساب", other: "{n} محادثة واتساب" })} × ${rate}`,
    issue: "إصدار الفاتورة",
    issuing: "جارٍ الإصدار…",
    issuedOn: (date: string) => `صدرت الفاتورة ${date}`,
    eyebrow: "الفواتير",
    title: "تكلفة دعواتك",
    subtitle: "تدفع فقط مقابل محادثات واتساب التي استخدمتها مناسباتك فعلاً — الدعوات والتذكيرات وبطاقات الدخول.",
    total: "الإجمالي لكل المناسبات",
    notInvoiced: "لم تصدر فاتورته بعد",
    conversationsTotal: "محادثات واتساب",
    byEvent: "حسب المناسبة",
    empty: "لا توجد تكاليف بعد — تظهر هنا بمجرد إرسال الدعوات.",
    conversationCount: (n: number) => plural("ar", n, { one: "محادثة واحدة", two: "محادثتان", few: "{n} محادثات", many: "{n} محادثة", other: "{n} محادثة" }),
  },

  newEvent: {
    eyebrow: "مناسبة جديدة",
    title: "ما هي المناسبة؟",
    stepOccasion: "نوع المناسبة",
    stepDetails: "التفاصيل",
    stepDetailsHint: "تظهر هذه التفاصيل في كل دعوة.",
    stepDesign: "اختر تصميم البطاقة",
    stepDesignHint: "يمكنك رؤية الشكل النهائي في المعاينة.",
    name: "اسم المناسبة",
    date: "التاريخ",
    venue: "المكان",
    optional: "(اختياري)",
    venuePlaceholder: "قاعة الريتز كارلتون، جدة",
    inviteLanguage: "لغة الدعوة",
    inviteLanguageHint: "لغة البطاقة ورسائل واتساب التي تصل إلى ضيوفك.",
    required: "بقي القليل — يرجى إدخال اسم المناسبة والتاريخ والداعي.",
    next: "بعد ذلك ستضيف ضيوفك.",
    create: "إنشاء المناسبة",
    creating: "جارٍ الإنشاء…",
    preview: "معاينة مباشرة",
    noDesigns: "لا توجد تصاميم لهذه المناسبة بعد — سنستخدم التصميم الكلاسيكي.",
    designs: "تصميم البطاقة",
  },

  login: {
    welcome: "أهلاً وسهلاً 👋",
    intro: "سجّل الدخول برقم جوالك لعرض مناسباتك. سنرسل لك رمزاً عبر واتساب.",
    phone: "رقم الجوال",
    phoneHelp: "الأرقام السعودية يمكن أن تبدأ بـ 05. للدول الأخرى أضف رمز الدولة مع +.",
    sendCode: "أرسل لي الرمز",
    sending: "جارٍ الإرسال…",
    changeNumber: "تغيير الرقم",
    checkWhatsApp: "تحقق من واتساب",
    sentTo: "أرسلنا رمزاً من 6 أرقام إلى",
    demoCode: "لم يتم ربط واتساب بعد، لذلك هذا هو رمزك:",
    code: "الرمز",
    signIn: "تسجيل الدخول",
    checking: "جارٍ التحقق…",
    resendIn: (s: number) => `يمكنك طلب رمز جديد بعد ${s} ث`,
    resend: "أرسل رمزاً جديداً",
  },

  card: {
    to: (name: string) => `إلى: ${name}`,
    message: (name: string, event: string, venue: string) =>
      `حياك الله يا ${name}! يسعدنا دعوتك إلى ${event}${venue ? ` في ${venue}` : ""}. هل ستشرفنا بالحضور؟`,
    announcement: (name: string, event: string, venue: string) =>
      `${name}، ${event}${venue ? ` — في ${venue}` : ""}. رحم الله الفقيد وأسكنه فسيح جناته.`,
    accept: "سأحضر",
    decline: "أعتذر",
    sampleGuest: "ليلى",
    eventFallback: "اسم مناسبتك",
  },

  errors: {
    network: "تعذر الاتصال — تحقق من الإنترنت وحاول مرة أخرى.",
    requestFailed: (status: number) => `تعذر تنفيذ الطلب (${status})`,
    invalidBody: "حدث خطأ في الطلب. حاول مرة أخرى.",
    signInAgain: "يرجى تسجيل الدخول مرة أخرى.",
    missingFields: "يرجى إدخال اسم المناسبة والتاريخ والداعي.",
    invalidOccasion: "يرجى اختيار نوع المناسبة.",
    invalidDate: "يرجى اختيار تاريخ صحيح.",
    templateMismatch: "تصميم البطاقة لا يناسب نوع المناسبة.",
    eventNotFound: "المناسبة غير موجودة",
    guestNotFound: "الضيف غير موجود",
    notFound: "غير موجود",
    enterPhone: "يرجى إدخال رقم جوالك.",
    invalidPhone: "رقم الجوال غير صحيح.",
    codeTooSoon: (s: number) => `أرسلنا لك رمزاً للتو. يمكنك طلب رمز جديد بعد ${s} ثانية.`,
    codeSendFailed: "تعذر إرسال الرمز إلى هذا الرقم عبر واتساب. حاول مرة أخرى.",
    enterCode: "يرجى إدخال الرمز المكون من 6 أرقام.",
    wrongCode: "الرمز غير صحيح أو انتهت صلاحيته. تحقق منه أو اطلب رمزاً جديداً.",
    addAtLeastOne: "يرجى إضافة ضيف واحد على الأقل.",
    noGuestsFound: "لم نجد أي ضيوف. يجب أن يحتوي كل صف على اسم ورقم جوال.",
    tooMany: (n: number, max: number) => `عدد الضيوف كبير (${n}). أضف ${max} كحد أقصى في كل مرة.`,
    enterName: "يرجى إدخال اسم الضيف.",
    duplicatePhone: "يوجد ضيف آخر في هذه المناسبة بنفس الرقم.",
    nothingToUpdate: "لا توجد تغييرات للحفظ.",
    invalidDecision: "يرجى اختيار «سيحضر» أو «معتذر».",
    guestNotInvitable: "رقم هذا الضيف به مشكلة ولم تُرسل له دعوة — صحّح الرقم أولاً.",
    noRsvp: "لا يُطلب من الضيوف الرد في هذه المناسبة.",
    noReminders: "لا تُرسل تذكيرات لهذه المناسبة.",
    reminderKind: "يرجى اختيار التذكير المراد إرساله.",
    reminderAlreadySent: "تم إرسال هذا التذكير مسبقاً.",
    invoiceAlready: (status: string) => `الفاتورة ${status} مسبقاً.`,
  },
};

export const messages: Record<Locale, Messages> = { en, ar };
