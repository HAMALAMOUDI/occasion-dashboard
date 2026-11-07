import type { Lang } from "./occasions";
import { CONTACT_EMAIL, PLANS } from "./pricing";

// Long-form public pages: policies, product and city pages, and guides. Each
// is written in English and Arabic; pages render whichever the visitor reads.

type T = Record<Lang, string>;

export interface ContentSection {
  heading: T;
  paragraphs?: T[];
  bullets?: T[];
}

export interface ContentPage {
  slug: string;
  kind: "legal" | "product" | "city" | "about" | "guide";
  title: T;
  description: T; // meta description and the line under the title
  eyebrow: T;
  sections: ContentSection[];
  faq?: { q: T; a: T }[];
  updated?: string; // YYYY-MM-DD, for policies and guides
  minutes?: number; // reading time, for guides
}

const UPDATED = "2026-11-07";
const sar = (n: number, lang: Lang) => (lang === "ar" ? `${n} ريال` : `SAR ${n}`);
const price = { en: sar(PLANS.standard.price, "en"), ar: sar(PLANS.standard.price, "ar") };
const customPrice = { en: sar(PLANS.custom.price, "en"), ar: sar(PLANS.custom.price, "ar") };

// ---------------------------------------------------------------- policies

const privacy: ContentPage = {
  slug: "privacy",
  kind: "legal",
  updated: UPDATED,
  eyebrow: { en: "Policies", ar: "السياسات" },
  title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  description: {
    en: "What Hikayati collects to send your invitations, why, who helps us, and the choices you and your guests have.",
    ar: "ما تجمعه حكايتي لإرسال دعواتك، ولماذا، ومن يساعدنا، وما الخيارات المتاحة لك ولضيوفك.",
  },
  sections: [
    {
      heading: { en: "Who we are", ar: "من نحن" },
      paragraphs: [
        {
          en: `Hikayati (حكايتي) is a digital invitation service based in Riyadh, Saudi Arabia. This policy explains how we handle personal data when you use hikayati's website and portal, and when you receive an invitation sent with Hikayati. Questions go to ${CONTACT_EMAIL}.`,
          ar: `حكايتي خدمة دعوات رقمية مقرها الرياض، المملكة العربية السعودية. توضّح هذه السياسة كيف نتعامل مع البيانات الشخصية عند استخدامك لموقع حكايتي وبوابتها، وعند استلامك دعوة أُرسلت عبر حكايتي. للاستفسار: ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      heading: { en: "What we collect from organizers", ar: "ما نجمعه من المنظّمين" },
      bullets: [
        { en: "Your WhatsApp number, which is how you sign in. We store only a scrambled (hashed) copy of each sign-in code.", ar: "رقم واتساب الخاص بك، وهو وسيلة تسجيل الدخول. ولا نحفظ من رموز الدخول إلا نسخة مشفّرة." },
        { en: "Your occasions: names, dates, venues, hosts, the wording and design of your card, and what you add to the invitation page.", ar: "مناسباتك: أسماؤها وتواريخها وأماكنها والداعون، ونص البطاقة وتصميمها، وما تضيفه إلى صفحة الدعوة." },
        { en: "Your guest list: names, mobile numbers and seats per invitation.", ar: "قائمة ضيوفك: الأسماء وأرقام الجوال وعدد المقاعد لكل دعوة." },
        { en: "A review, if you choose to write one.", ar: "رأيك عن الخدمة، إن اخترت كتابته." },
      ],
    },
    {
      heading: { en: "What we hold about guests", ar: "ما نحفظه عن الضيوف" },
      paragraphs: [
        {
          en: "Guests don't sign up. We hold the name and mobile number their host gave us, their reply and how many are coming, their entry pass code, and when they were checked in at the door. Each guest's invitation page is private: it opens only from their own link and is kept out of search engines.",
          ar: "لا يسجّل الضيوف حساباً. نحفظ الاسم ورقم الجوال اللذين أعطانا إياهما الداعي، وردّ الضيف وعدد الحاضرين، ورمز بطاقة الدخول، ووقت تسجيل وصوله. وصفحة دعوة كل ضيف خاصة: لا تُفتح إلا من رابطه، ولا تظهر في محركات البحث.",
        },
        {
          en: "Organizers confirm that their guests are happy to hear from them on WhatsApp. A guest who would rather not can ask their host, or us, to remove them.",
          ar: "يؤكد المنظّمون أن ضيوفهم يرحّبون بالتواصل معهم عبر واتساب. ومن لا يرغب من الضيوف يمكنه أن يطلب من الداعي، أو منّا، حذف بياناته.",
        },
      ],
    },
    {
      heading: { en: "Why we use it", ar: "لماذا نستخدمها" },
      bullets: [
        { en: "To send invitations, entry passes and reminders, and to record replies and arrivals.", ar: "لإرسال الدعوات وبطاقات الدخول والتذكيرات، وتسجيل الردود والحضور." },
        { en: "To sign you in and keep your occasions private to you.", ar: "لتسجيل دخولك وإبقاء مناسباتك خاصة بك." },
        { en: "To answer you when you write to us, and to keep the service secure.", ar: "للرد عليك عند مراسلتنا، وللحفاظ على أمان الخدمة." },
      ],
      paragraphs: [{ en: "We don't sell personal data, and we don't use guest lists for marketing.", ar: "لا نبيع البيانات الشخصية، ولا نستخدم قوائم الضيوف في التسويق." }],
    },
    {
      heading: { en: "Who helps us", ar: "من يساعدنا" },
      bullets: [
        { en: "Meta, through the WhatsApp Business Platform, delivers messages to guests and sign-in codes to organizers.", ar: "شركة Meta، عبر منصة واتساب للأعمال، توصل الرسائل إلى الضيوف ورموز الدخول إلى المنظّمين." },
        { en: "Our hosting and database providers run the website and store its data.", ar: "مزوّدو الاستضافة وقواعد البيانات يشغّلون الموقع ويحفظون بياناته." },
      ],
      paragraphs: [{ en: "They process data only to provide these services to us.", ar: "ولا يعالجون البيانات إلا لتقديم هذه الخدمات لنا." }],
    },
    {
      heading: { en: "Cookies", ar: "ملفات تعريف الارتباط" },
      paragraphs: [
        {
          en: "We use two cookies: one keeps you signed in (for up to 30 days), and one remembers whether you read the site in Arabic or English. There are no advertising or tracking cookies.",
          ar: "نستخدم ملفين فقط: أحدهما يبقيك مسجّل الدخول (حتى 30 يوماً)، والآخر يتذكر لغة تصفّحك، العربية أو الإنجليزية. ولا توجد ملفات للإعلانات أو التتبّع.",
        },
      ],
    },
    {
      heading: { en: "How long we keep it, and your rights", ar: "مدة الحفظ وحقوقك" },
      paragraphs: [
        {
          en: "We keep your occasions while your account is in use. You can remove guests yourself at any time, and you can ask us to delete an occasion or your whole account. Under Saudi Arabia's Personal Data Protection Law you can ask to see, correct or delete your personal data; write to us from the number or email we know you by.",
          ar: "نحتفظ بمناسباتك ما دام حسابك مستخدماً. ويمكنك حذف الضيوف بنفسك في أي وقت، كما يمكنك أن تطلب منا حذف مناسبة أو حسابك كله. وبموجب نظام حماية البيانات الشخصية في المملكة يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها؛ راسلنا من الرقم أو البريد المعروف لدينا.",
        },
      ],
    },
    {
      heading: { en: "Changes", ar: "التعديلات" },
      paragraphs: [
        { en: "If we change this policy, we'll update the date above, and tell organizers in the portal about anything important.", ar: "إذا عدّلنا هذه السياسة سنحدّث التاريخ أعلاه، ونبلغ المنظّمين في البوابة بأي تغيير مهم." },
      ],
    },
  ],
};

const terms: ContentPage = {
  slug: "terms",
  kind: "legal",
  updated: UPDATED,
  eyebrow: { en: "Policies", ar: "السياسات" },
  title: { en: "Terms of Use", ar: "شروط الاستخدام" },
  description: { en: "The agreement between you and Hikayati when you create and send invitations.", ar: "الاتفاق بينك وبين حكايتي عند إنشاء الدعوات وإرسالها." },
  sections: [
    {
      heading: { en: "The service", ar: "الخدمة" },
      paragraphs: [
        {
          en: "Hikayati lets you design invitation cards, send them to your guests on WhatsApp, give each guest a private invitation page, collect replies, send reminders, and check guests in at the door. By signing in you agree to these terms.",
          ar: "تتيح لك حكايتي تصميم بطاقات الدعوة وإرسالها إلى ضيوفك عبر واتساب، ومنح كل ضيف صفحة دعوة خاصة، وجمع الردود وإرسال التذكيرات وتسجيل حضور الضيوف عند المدخل. وبتسجيل دخولك فإنك توافق على هذه الشروط.",
        },
      ],
    },
    {
      heading: { en: "Your account", ar: "حسابك" },
      paragraphs: [
        {
          en: "You sign in with a code sent to your WhatsApp number. Keep your phone secure: anyone who can read your WhatsApp messages can sign in as you.",
          ar: "تسجّل الدخول برمز يُرسل إلى رقم واتساب الخاص بك. حافظ على أمان هاتفك: فكل من يستطيع قراءة رسائلك في واتساب يمكنه الدخول باسمك.",
        },
      ],
    },
    {
      heading: { en: "What you agree to", ar: "ما تلتزم به" },
      bullets: [
        { en: "You only invite people who know you and are happy to hear from you on WhatsApp.", ar: "ألا تدعو إلا من يعرفك ويرحّب بتواصلك معه عبر واتساب." },
        { en: "Your wording, names and details are yours to use, lawful and respectful.", ar: "أن يكون نصّك والأسماء والتفاصيل من حقك استخدامها، ونظامية ولائقة." },
        { en: "You don't use Hikayati for advertising, bulk messaging or anything other than invitations to real occasions.", ar: "ألا تستخدم حكايتي للإعلانات أو الرسائل الجماعية أو أي غرض غير الدعوة إلى مناسبات حقيقية." },
      ],
    },
    {
      heading: { en: "Payment", ar: "الدفع" },
      paragraphs: [
        {
          en: `The Hikayati plan is one payment of ${price.en} per occasion, and a custom design is ${customPrice.en}; there is no subscription. The price you see at checkout is the price you pay. Refunds follow our Refund Policy.`,
          ar: `باقة حكايتي دفعة واحدة قدرها ${price.ar} لكل مناسبة، والتصميم الخاص ${customPrice.ar}، ولا يوجد اشتراك. السعر الذي تراه عند الدفع هو ما تدفعه. وتخضع المبالغ المستردة لسياسة الاسترداد.`,
        },
      ],
    },
    {
      heading: { en: "Content and designs", ar: "المحتوى والتصاميم" },
      paragraphs: [
        {
          en: "What you write stays yours; you let us store it and show it to your guests so we can provide the service. The card designs belong to Hikayati: you may use them for your own invitations, not resell or reuse them elsewhere.",
          ar: "ما تكتبه يبقى ملكك، وتأذن لنا بحفظه وعرضه على ضيوفك لتقديم الخدمة. أما تصاميم البطاقات فهي ملك لحكايتي، ويحق لك استخدامها لدعواتك فقط، دون إعادة بيعها أو استخدامها في مكان آخر.",
        },
      ],
    },
    {
      heading: { en: "Availability", ar: "توفّر الخدمة" },
      paragraphs: [
        {
          en: "Messages travel through WhatsApp, which we don't control. We do our best to deliver every invitation and show you any that didn't arrive, but we can't promise delivery to every number. To the extent the law allows, our responsibility for any problem is limited to what you paid for that occasion.",
          ar: "تمرّ الرسائل عبر واتساب، وهو خارج سيطرتنا. نبذل جهدنا لإيصال كل دعوة ونُظهر لك ما لم يصل منها، لكن لا يمكننا ضمان الوصول إلى كل رقم. وفي حدود ما يسمح به النظام، تقتصر مسؤوليتنا عن أي مشكلة على ما دفعته لتلك المناسبة.",
        },
      ],
    },
    {
      heading: { en: "Ending, changes and law", ar: "الإنهاء والتعديلات والنظام" },
      paragraphs: [
        {
          en: `You can stop using Hikayati whenever you like, and ask us to delete your data. We may suspend accounts that break these terms. If we change the terms we'll update the date above. These terms are governed by the laws of the Kingdom of Saudi Arabia. Contact: ${CONTACT_EMAIL}.`,
          ar: `يمكنك التوقف عن استخدام حكايتي متى شئت، وطلب حذف بياناتك. وقد نوقف الحسابات المخالفة لهذه الشروط. وإذا عدّلنا الشروط حدّثنا التاريخ أعلاه. تخضع هذه الشروط لأنظمة المملكة العربية السعودية. للتواصل: ${CONTACT_EMAIL}.`,
        },
      ],
    },
  ],
};

const refund: ContentPage = {
  slug: "refund",
  kind: "legal",
  updated: UPDATED,
  eyebrow: { en: "Policies", ar: "السياسات" },
  title: { en: "Refund Policy", ar: "سياسة الاسترداد" },
  description: { en: "Payments are final. If something isn't right, tell us and we'll fix it.", ar: "المدفوعات نهائية. وإذا لم يكن شيء كما ينبغي، أخبرنا ونصلحه." },
  sections: [
    {
      heading: { en: "Payments are final", ar: "المدفوعات نهائية" },
      paragraphs: [
        {
          en: "Your payment opens every tool for your occasion straight away, so payments aren't refundable once made. Where the law gives you a right to cancel, that right still applies.",
          ar: "تفتح دفعتك جميع أدوات مناسبتك فوراً، لذا لا تُسترد المدفوعات بعد إتمامها. وحيث يمنحك النظام حق الإلغاء، يبقى هذا الحق قائماً.",
        },
      ],
    },
    {
      heading: { en: "Something not right? We'll fix it", ar: "هل هناك خلل؟ سنصلحه" },
      paragraphs: [
        {
          en: `Write to ${CONTACT_EMAIL} from the number or email on your account, with the name of the occasion. We reply within two working days, and we'll put it right.`,
          ar: `راسلنا على ${CONTACT_EMAIL} من الرقم أو البريد المسجّل في حسابك، مع اسم المناسبة. نرد خلال يومي عمل، ونصلح المشكلة.`,
        },
      ],
    },
    {
      heading: { en: "What this covers", ar: "ما تشمله السياسة" },
      paragraphs: [
        {
          en: `Every payment made to Hikayati: the ${price.en} Hikayati plan and the ${customPrice.en} custom design. Prices are shown in Saudi riyals before you pay.`,
          ar: `كل دفعة إلى حكايتي: باقة حكايتي بسعر ${price.ar} والتصميم الخاص بسعر ${customPrice.ar}. تُعرض الأسعار بالريال السعودي قبل الدفع.`,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- product and city pages

const howItWorks = (city?: T): ContentSection => ({
  heading: { en: "From the first card to the last guest", ar: "من أول بطاقة إلى آخر ضيف" },
  bullets: [
    { en: "Choose a design for your occasion and its colours.", ar: "اختر تصميماً لمناسبتك وألوانه." },
    { en: "Add the names, wording, date, venue and programme.", ar: "أضف الأسماء والنص والتاريخ والمكان والبرنامج." },
    {
      en: `Upload your guest list from Excel, with seats for each family${city ? ` — guests outside ${city.en} reply just the same` : ""}.`,
      ar: `ارفع قائمة الضيوف من Excel مع عدد المقاعد لكل عائلة${city ? ` — ويرد الضيوف من خارج ${city.ar} بالطريقة نفسها` : ""}.`,
    },
    { en: "Every guest gets their invitation on WhatsApp, by name, with their own page and reply buttons.", ar: "يستلم كل ضيف دعوته عبر واتساب باسمه، مع صفحته الخاصة وأزرار الرد." },
    { en: "Follow replies live, remind the ones still waiting, and scan passes at the door.", ar: "تابع الردود مباشرة، وذكّر من لم يرد، وامسح البطاقات عند المدخل." },
  ],
});

const digitalInvitations: ContentPage = {
  slug: "digital-invitations",
  kind: "product",
  eyebrow: { en: "Digital invitations", ar: "الدعوات الرقمية" },
  title: { en: "A digital invitation that does the work for you", ar: "دعوة رقمية تقوم بالعمل عنك" },
  description: {
    en: "Arabic invitation cards sent on WhatsApp, each with the guest's own page, live replies, seats for families and a QR pass for the door.",
    ar: "بطاقات دعوة عربية تُرسل عبر واتساب، لكل ضيف صفحته وردّه المباشر، مع مقاعد للعائلات ورمز QR للدخول.",
  },
  sections: [
    {
      heading: { en: "More than a picture in a chat", ar: "أكثر من صورة في محادثة" },
      paragraphs: [
        {
          en: "An image forwarded around family groups can't tell you who is coming, can't be corrected once it's out, and can't guide anyone to the venue. A Hikayati invitation is addressed to each guest by name, opens onto their own page, and sends their reply straight to you.",
          ar: "الصورة التي تتنقل بين مجموعات العائلة لا تخبرك بمن سيحضر، ولا يمكن تصحيحها بعد إرسالها، ولا ترشد أحداً إلى المكان. أما دعوة حكايتي فتصل إلى كل ضيف باسمه، وتفتح على صفحته الخاصة، وتوصل ردّه إليك مباشرة.",
        },
      ],
    },
    {
      heading: { en: "What every invitation includes", ar: "ما تتضمنه كل دعوة" },
      bullets: [
        { en: "A card from 488 Arabic designs, with your names and the date in both calendars.", ar: "بطاقة من 488 تصميماً عربياً، بأسمائكم والتاريخ بالتقويمين." },
        { en: "A private page per guest: countdown, programme, directions, dress code and gifts.", ar: "صفحة خاصة لكل ضيف: عدّ تنازلي وبرنامج واتجاهات ولباس وهدايا." },
        { en: "One-tap replies on WhatsApp or the page, with how many of the family are coming.", ar: "رد بلمسة واحدة في واتساب أو الصفحة، مع عدد الحاضرين من العائلة." },
        { en: "A QR entry pass for everyone who accepts, scanned at the door from your phone.", ar: "بطاقة دخول QR لكل من يقبل، تُمسح عند المدخل من هاتفك." },
      ],
    },
    howItWorks(),
  ],
  faq: [
    { q: { en: "Do guests need an app?", ar: "هل يحتاج الضيوف إلى تطبيق؟" }, a: { en: "No. The invitation arrives on WhatsApp and the page opens in their phone's browser.", ar: "لا. تصل الدعوة عبر واتساب وتفتح الصفحة في متصفح الهاتف." } },
    { q: { en: "Can I change details after sending?", ar: "هل أستطيع تعديل التفاصيل بعد الإرسال؟" }, a: { en: "Yes. Update the programme, map or note once and every guest's page shows the new details.", ar: "نعم. عدّل البرنامج أو الخريطة أو الملاحظة مرة واحدة فتظهر في صفحة كل ضيف." } },
    { q: { en: "What does it cost?", ar: "كم التكلفة؟" }, a: { en: `${price.en}, once per occasion, with no subscription.`, ar: `${price.ar} مرة واحدة لكل مناسبة، دون اشتراك.` } },
  ],
};

const guestList: ContentPage = {
  slug: "guest-list-management",
  kind: "product",
  eyebrow: { en: "Guest list", ar: "قائمة الضيوف" },
  title: { en: "One live guest list, from invitation to the door", ar: "قائمة ضيوف حيّة واحدة، من الدعوة حتى المدخل" },
  description: {
    en: "Families and plus-ones, live replies and seat counts, reminders for those still waiting and door check-in, in one place.",
    ar: "العائلات والمرافقون، والردود وعدد المقاعد مباشرة، وتذكير من لم يرد، وتسجيل الحضور عند المدخل، في مكان واحد.",
  },
  sections: [
    {
      heading: { en: "Know who is coming, and how many", ar: "اعرف من سيحضر، وكم عددهم" },
      paragraphs: [
        {
          en: "Lists fall apart when names live in one sheet and replies arrive in a dozen chats. In Hikayati each invitation carries its seats, and each reply updates your count the moment it arrives — ready for the caterer and the seating.",
          ar: "تتفكك القوائم حين تكون الأسماء في جدول والردود في عشرات المحادثات. في حكايتي تحمل كل دعوة عدد مقاعدها، ويحدّث كل رد العدد لحظة وصوله — جاهزاً للضيافة وترتيب الجلوس.",
        },
      ],
    },
    {
      heading: { en: "Built for real families", ar: "مصممة للعائلات الحقيقية" },
      bullets: [
        { en: "One invitation per household, with as many seats as you allow.", ar: "دعوة واحدة لكل أسرة، بعدد المقاعد الذي تحدده." },
        { en: "Guests choose how many of them are coming, never more than their seats.", ar: "يختار الضيوف عدد الحاضرين منهم، دون تجاوز مقاعدهم." },
        { en: "Upload from Excel with Name, Mobile and Seats columns, in Arabic or English.", ar: "ارفع من Excel بأعمدة الاسم والجوال والمقاعد، بالعربية أو الإنجليزية." },
        { en: "Filter by reply, remind only those still waiting, and fix numbers that didn't go through.", ar: "صنّف حسب الرد، وذكّر من لم يرد فقط، وصحّح الأرقام التي لم تصل." },
        { en: "On the day, scan passes at the door: each one works once.", ar: "يوم المناسبة امسح البطاقات عند المدخل: كل بطاقة تعمل مرة واحدة." },
      ],
    },
    howItWorks(),
  ],
};

const city = (slug: string, name: T, venues: T): ContentPage => ({
  slug,
  kind: "city",
  eyebrow: { en: `Hikayati in ${name.en}`, ar: `حكايتي في ${name.ar}` },
  title: { en: `Digital invitations for occasions in ${name.en}`, ar: `دعوات رقمية لمناسبات ${name.ar}` },
  description: {
    en: `Arabic invitation cards for weddings and family occasions in ${name.en}, sent on WhatsApp with live replies and QR entry passes.`,
    ar: `بطاقات دعوة عربية للأعراس والمناسبات العائلية في ${name.ar}، تُرسل عبر واتساب مع ردود مباشرة وبطاقات دخول QR.`,
  },
  sections: [
    {
      heading: { en: `Made for ${name.en}'s celebrations`, ar: `مصممة لأفراح ${name.ar}` },
      paragraphs: [
        {
          en: `From ${venues.en}, an occasion in ${name.en} brings families together from across the Kingdom. Hikayati gives each household its own invitation on WhatsApp, in Arabic or English, and keeps every reply in one list.`,
          ar: `من ${venues.ar}، تجمع مناسبات ${name.ar} العائلات من أنحاء المملكة. تمنح حكايتي كل أسرة دعوتها الخاصة عبر واتساب، بالعربية أو الإنجليزية، وتجمع كل الردود في قائمة واحدة.`,
        },
      ],
    },
    {
      heading: { en: "For every occasion", ar: "لكل مناسبة" },
      bullets: [
        { en: "Weddings, engagements (malka) and henna nights", ar: "الأعراس والملكة وليالي الحناء" },
        { en: "Graduations, birthdays and new babies", ar: "التخرج وأعياد الميلاد والمواليد" },
        { en: "Eid gatherings and Ramadan ghabga", ar: "معايدات العيد وغبقات رمضان" },
        { en: "Corporate events, and calm condolence notices", ar: "المناسبات الرسمية، وإشعارات العزاء الهادئة" },
      ],
    },
    howItWorks(name),
  ],
  faq: [
    { q: { en: `Can guests outside ${name.en} reply?`, ar: `هل يستطيع الضيوف خارج ${name.ar} الرد؟` }, a: { en: "Yes. Anyone with WhatsApp can open their invitation and reply, wherever they are.", ar: "نعم. كل من لديه واتساب يستطيع فتح دعوته والرد أينما كان." } },
    { q: { en: "How much does it cost?", ar: "كم التكلفة؟" }, a: { en: `${price.en} once per occasion, with every tool included.`, ar: `${price.ar} مرة واحدة لكل مناسبة، وتشمل جميع الأدوات.` } },
  ],
});

const riyadh = city("invitations-riyadh", { en: "Riyadh", ar: "الرياض" }, { en: "wedding halls on King Fahd Road to istirahas on the city's edge", ar: "قاعات الأفراح على طريق الملك فهد إلى الاستراحات في أطراف المدينة" });
const jeddah = city("invitations-jeddah", { en: "Jeddah", ar: "جدة" }, { en: "seafront hotels on the Corniche to family homes in Al-Balad's neighbours", ar: "فنادق الكورنيش على البحر إلى بيوت العائلات حول البلد" });

const about: ContentPage = {
  slug: "about",
  kind: "about",
  eyebrow: { en: "About Hikayati", ar: "عن حكايتي" },
  title: { en: "Invitations worth keeping, made genuinely useful", ar: "دعوات تستحق أن تُحفظ، ومفيدة حقاً" },
  description: {
    en: "Hikayati is a Riyadh-based invitation service for Saudi families: Arabic cards, WhatsApp delivery, live replies and door check-in.",
    ar: "حكايتي خدمة دعوات مقرها الرياض للعائلات السعودية: بطاقات عربية، وإرسال عبر واتساب، وردود مباشرة، وتسجيل الحضور عند المدخل.",
  },
  sections: [
    {
      heading: { en: "What we're building", ar: "ما نبنيه" },
      paragraphs: [
        {
          en: "A Hikayati invitation is a card, a private page and a reply in one. Families choose a design made in Arabic from the start, send it to each guest by name on WhatsApp, and see who is coming as it happens.",
          ar: "دعوة حكايتي بطاقة وصفحة خاصة ورد في آن واحد. تختار العائلات تصميماً عربياً من الأساس، وترسله إلى كل ضيف باسمه عبر واتساب، وترى من سيحضر لحظة بلحظة.",
        },
      ],
    },
    {
      heading: { en: "Arabic first", ar: "العربية أولاً" },
      paragraphs: [
        {
          en: "Our cards are designed in Arabic, with Hijri and Gregorian dates and wording for each occasion — from a wedding's blessing to a condolence's quiet words. The portal works fully in Arabic and English.",
          ar: "صُممت بطاقاتنا بالعربية، بالتاريخين الهجري والميلادي وبعبارات تناسب كل مناسبة — من تهنئة الزواج إلى كلمات العزاء الهادئة. وتعمل البوابة بالكامل بالعربية والإنجليزية.",
        },
      ],
    },
    {
      heading: { en: "Guests' privacy stays private", ar: "خصوصية الضيوف مصونة" },
      paragraphs: [
        {
          en: "Guest lists are never used for marketing, and personal invitation pages are kept out of search engines. Our Privacy Policy explains the details.",
          ar: "لا تُستخدم قوائم الضيوف في التسويق أبداً، وتبقى صفحات الدعوة الشخصية خارج محركات البحث. وتوضح سياسة الخصوصية التفاصيل.",
        },
      ],
    },
    {
      heading: { en: "Talk to us", ar: "تواصل معنا" },
      paragraphs: [{ en: `Questions, ideas and corrections are welcome at ${CONTACT_EMAIL}.`, ar: `نرحب بأسئلتكم وأفكاركم وملاحظاتكم على ${CONTACT_EMAIL}.` }],
    },
  ],
};

// ---------------------------------------------------------------- guides

const whatsappGuide: ContentPage = {
  slug: "whatsapp-invitations",
  kind: "guide",
  updated: UPDATED,
  minutes: 4,
  eyebrow: { en: "Guide", ar: "دليل" },
  title: { en: "How to send invitations on WhatsApp, the right way", ar: "كيف ترسل الدعوات عبر واتساب بالطريقة الصحيحة" },
  description: {
    en: "Personal messages or a broadcast? An image or a link? How to invite on WhatsApp so guests reply, and you can count them.",
    ar: "رسائل شخصية أم بث جماعي؟ صورة أم رابط؟ كيف تدعو عبر واتساب ليرد الضيوف وتستطيع عدّهم.",
  },
  sections: [
    {
      heading: { en: "Send to each guest, not to a group", ar: "أرسل لكل ضيف، لا لمجموعة" },
      paragraphs: [
        {
          en: "A message addressed by name gets read and answered; a card dropped in a family group gets a row of hearts and no headcount. Send each household its own invitation, and you'll know exactly who it reached.",
          ar: "الرسالة التي تحمل اسم الضيف تُقرأ ويُرد عليها؛ أما البطاقة في مجموعة العائلة فتحصد القلوب دون أن تعرف العدد. أرسل لكل أسرة دعوتها، وستعرف بالضبط من وصلته.",
        },
      ],
    },
    {
      heading: { en: "Make replying effortless", ar: "اجعل الرد سهلاً" },
      paragraphs: [
        {
          en: "\"Let us know if you're coming\" invites silence. Two clear buttons — coming, or not — get answers within hours. Ask families how many of them will come, and cap it at the seats you've set aside.",
          ar: "عبارة «أخبرونا إن كنتم ستحضرون» تقابل غالباً بالصمت. أما زرّان واضحان — سأحضر أو أعتذر — فيأتيان بالرد خلال ساعات. واسأل العائلات عن عدد الحاضرين منها، في حدود المقاعد التي خصصتها.",
        },
      ],
    },
    {
      heading: { en: "Keep the details in one place", ar: "اجمع التفاصيل في مكان واحد" },
      bullets: [
        { en: "The card carries the essentials: names, date, time and venue.", ar: "تحمل البطاقة الأساسيات: الأسماء والتاريخ والوقت والمكان." },
        { en: "A link holds the rest: map, programme, dress code, gifts.", ar: "ويحمل الرابط الباقي: الخريطة والبرنامج واللباس والهدايا." },
        { en: "Change a detail once in the link instead of re-sending a corrected image.", ar: "عدّل التفصيل مرة واحدة في الرابط بدلاً من إعادة إرسال صورة مصحّحة." },
      ],
    },
    {
      heading: { en: "Time it well", ar: "اختر التوقيت المناسب" },
      paragraphs: [
        {
          en: "Send weddings three to four weeks ahead, smaller gatherings one to two. Remind those who haven't replied a week before, and send everyone coming a short note on the day.",
          ar: "أرسل دعوات الأعراس قبل ثلاثة إلى أربعة أسابيع، والجمعات الأصغر قبل أسبوع إلى أسبوعين. وذكّر من لم يرد قبل أسبوع، وأرسل للحاضرين تذكيراً قصيراً يوم المناسبة.",
        },
      ],
    },
  ],
};

const wordingGuide: ContentPage = {
  slug: "invitation-wording",
  kind: "guide",
  updated: UPDATED,
  minutes: 5,
  eyebrow: { en: "Guide", ar: "دليل" },
  title: { en: "Invitation wording for every occasion, in Arabic and English", ar: "صيغ الدعوة لكل مناسبة، بالعربية والإنجليزية" },
  description: {
    en: "Opening lines, invitations and closings for weddings, malka, graduations, Eid and condolences — ready to adapt.",
    ar: "عبارات افتتاحية ونصوص دعوة وخواتيم للأعراس والملكة والتخرج والعيد والعزاء — جاهزة للتعديل.",
  },
  sections: [
    {
      heading: { en: "The shape of an invitation", ar: "بنية الدعوة" },
      bullets: [
        { en: "An opening line: the Bismillah, a blessing, or a greeting for the season.", ar: "عبارة افتتاحية: البسملة أو دعاء أو تهنئة بالمناسبة." },
        { en: "Who invites: the families, the parents, or the hosts by name.", ar: "الداعي: الأسرتان أو الوالدان أو المضيفون بأسمائهم." },
        { en: "The invitation itself, the names, then the date, time and place.", ar: "نص الدعوة والأسماء، ثم التاريخ والوقت والمكان." },
        { en: "A closing line: \"Your presence completes our joy.\"", ar: "خاتمة: «حضوركم يكمل فرحتنا»." },
      ],
    },
    {
      heading: { en: "Weddings and malka", ar: "الأعراس والملكة" },
      paragraphs: [
        { en: "\"The two families are honoured to invite you to the wedding of their children, Fahad and Nouf.\"", ar: "«تتشرف الأسرتان الكريمتان بدعوتكم لحضور حفل زفاف ابنيهما فهد ونوف»." },
        { en: "\"With hearts full of joy, we share with you the marriage contract of our son and daughter.\"", ar: "«بقلوب ملؤها الفرح نشارككم عقد قران ابننا وابنتنا»." },
      ],
    },
    {
      heading: { en: "Graduations, Eid and Ramadan", ar: "التخرج والعيد ورمضان" },
      paragraphs: [
        { en: "\"Share the joy of her achievement as she graduates from King Abdulaziz University.\"", ar: "«شاركونا فرحة الإنجاز بتخرجها من جامعة الملك عبدالعزيز»." },
        { en: "\"We'd be delighted to welcome you to exchange Eid greetings.\"", ar: "«يسعدنا استقبالكم لتبادل التهاني بعيد الفطر المبارك»." },
        { en: "\"Join us at the ghabga table on the nights of the blessed month.\"", ar: "«يسعدنا اجتماعكم على مائدة الغبقة في ليالي الشهر الفضيل»." },
      ],
    },
    {
      heading: { en: "Condolences", ar: "العزاء" },
      paragraphs: [
        {
          en: "Keep it simple and calm, with no request to reply: \"With hearts accepting God's decree, the family receives condolences for their late father,\" then the place and times.",
          ar: "اجعلها بسيطة وهادئة، دون طلب رد: «بقلوب مؤمنة بقضاء الله وقدره، تتقبل الأسرة العزاء في فقيدها»، ثم المكان والأوقات.",
        },
      ],
    },
  ],
};

const rsvpGuide: ContentPage = {
  slug: "rsvp-deadline",
  kind: "guide",
  updated: UPDATED,
  minutes: 4,
  eyebrow: { en: "Guide", ar: "دليل" },
  title: { en: "When to ask for replies, and how to get them", ar: "متى تطلب الردود، وكيف تحصل عليها" },
  description: {
    en: "Work back from your caterer's deadline, ask clearly, and remind kindly — a practical plan for a confirmed headcount.",
    ar: "ابدأ من موعد متعهد الضيافة، واطلب بوضوح، وذكّر بلطف — خطة عملية لعدد حضور مؤكد.",
  },
  sections: [
    {
      heading: { en: "Start from the venue's deadline", ar: "ابدأ من موعد القاعة" },
      paragraphs: [
        {
          en: "Ask your venue and caterer when they need final numbers — often a week to ten days ahead. Set your reply date a few days before that, so late answers still fit.",
          ar: "اسأل القاعة ومتعهد الضيافة متى يحتاجون العدد النهائي — غالباً قبل أسبوع إلى عشرة أيام. وحدد موعد الرد قبل ذلك ببضعة أيام لتستوعب الردود المتأخرة.",
        },
      ],
    },
    {
      heading: { en: "Count seats, not invitations", ar: "عُدّ المقاعد لا الدعوات" },
      paragraphs: [
        {
          en: "One invitation to a family of five is five plates. Give each household its seats up front, and let them tell you how many are coming. Your total stays honest, and nobody brings an unexpected guest.",
          ar: "دعوة واحدة لعائلة من خمسة تعني خمسة أطباق. حدد لكل أسرة مقاعدها مسبقاً، ودعها تخبرك بعدد الحاضرين. فيبقى العدد دقيقاً، ولا يأتي ضيف غير متوقع.",
        },
      ],
    },
    {
      heading: { en: "Remind kindly, once or twice", ar: "ذكّر بلطف، مرة أو مرتين" },
      bullets: [
        { en: "A week before: a gentle reminder to those who haven't replied.", ar: "قبل أسبوع: تذكير لطيف لمن لم يرد." },
        { en: "On the day: a short note to everyone coming, with the map.", ar: "يوم المناسبة: رسالة قصيرة للحاضرين مع الخريطة." },
        { en: "Call the few still silent yourself; record their answer in the list.", ar: "اتصل بنفسك بالقلة التي لم ترد، وسجّل ردهم في القائمة." },
      ],
    },
  ],
};

export const PAGES: ContentPage[] = [privacy, terms, refund, about, digitalInvitations, guestList, riyadh, jeddah];
export const GUIDES: ContentPage[] = [whatsappGuide, wordingGuide, rsvpGuide];

export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);
export const guideBySlug = (slug: string) => GUIDES.find((p) => p.slug === slug);
