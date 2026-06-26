import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    login: "Log In",
    register: "Register",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    username: "Username",
    signIn: "Sign In",
    signUp: "Sign Up",
    logout: "Log Out",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    // Navigation
    dashboard: "Dashboard",
    groups: "Groups",
    history: "History",
    profile: "Profile",
    // Dashboard
    totalExpenses: "Total Expenses",
    youPaid: "You Paid",
    youOwe: "You Owe",
    youAreOwed: "You are Owed",
    recentTransactions: "Recent Transactions",
    monthlyStats: "Monthly Statistics",
    noTransactions: "No transactions recorded yet.",
    netBalance: "Net Balance",
    settledUp: "You are all settled up!",
    owesYou: "owes you",
    youOweUser: "you owe",
    // Groups
    createGroup: "Create Group",
    groupName: "Group Name",
    groupDesc: "Group Description",
    noGroups: "No groups found. Create one to get started!",
    members: "Members",
    addMember: "Add Member",
    inviteLink: "Invite Link",
    createdBy: "Created by",
    inviteEmail: "Invite by Email/Username",
    inviteSuccess: "Member added successfully!",
    joinGroup: "Join Group",
    // Expenses
    addExpense: "Add Expense",
    expenseTitle: "Title",
    expenseDesc: "Description",
    amount: "Amount",
    date: "Date",
    category: "Category",
    paidBy: "Paid By",
    membersInvolved: "Members Involved",
    splitType: "Split Type",
    equal: "Equal",
    custom: "Exact Amounts",
    percentage: "Percentage",
    receiptUpload: "Receipt (optional URL)",
    save: "Save",
    cancel: "Cancel",
    settleDebt: "Settle Debt",
    settleUp: "Settle Up",
    historyFilters: "Filters",
    search: "Search...",
    // Categories
    food: "Food & Dining",
    transport: "Transportation",
    rent: "Rent & Utilities",
    entertainment: "Entertainment",
    shopping: "Shopping",
    other: "Other",
    // Notifications
    notifications: "Notifications",
    noNotifications: "No new notifications",
    markAllRead: "Mark all as read",
    // Added keys
    memberBalances: "Member Balances",
    simplifiedDebts: "Simplified Debts",
    getsBack: "Gets back",
    owes: "Owes",
    settledUpLabel: "Settled Up",
    noDescription: "No description provided.",
    balancesSimplified: "Balances are simplified automatically to minimize transfers.",
    paymentRecorded: "Payment recorded",
    payerFromUser: "Payer (From User)",
    recipientToUser: "Recipient (To User)",
    selectPayer: "Select Payer",
    selectRecipient: "Select Recipient",
    splitMethod: "Split Method",
    selectMembersCost: "Select members sharing this cost",
    inputExactAmounts: "Input Exact Amounts Owed",
    inputPercentage: "Input percentage share (%)",
    allSettled: "All settled!",
    remaining: "remaining",
    overTotal: "over total",
    pendingConfirmation: "Pending Confirmation",
    confirmed: "Confirmed",
    confirm: "Confirm",
    reject: "Reject",
    acceptTransaction: "Accept this transaction?",
    receipt: "Receipt",
    shareReceipt: "Share Receipt",
    reimbursementReceipt: "Reimbursement Receipt",
    shareMsg: "I settled my reimbursement of {amount} MAD in group '{group}' via Watch Guard! 💸",
    copiedToClipboard: "Copied to clipboard!",
    download: "Download",
    hello: "Hello",
    welcomeBack: "Welcome back to your Watch Guard dashboard.",
    owedToOthers: "OWED TO OTHERS",
    settled: "SETTLED",
    owedToYou: "OWED TO YOU",
    inviteCodeLabel: "Invite Code",
    whatIsGroupFor: "What is this group for?",
    enter8digit: "Enter 8-digit code (e.g. A1B2C3D4)",
    viewDetails: "View Details",
    completeTransactionList: "Complete transaction list. Filter, sort, and search.",
    filters: "Filters",
    allGroups: "All Groups",
    allCategories: "All Categories",
    newestFirst: "Newest First",
    oldestFirst: "Oldest First",
    highestAmount: "Highest Amount",
    lowestAmount: "Lowest Amount",
    startDate: "Start Date",
    endDate: "End Date",
    noMatchingRecords: "No matching records found.",
    paid: "paid",
    paidUser: "paid"
  },
  fr: {
    // Auth
    login: "Se connecter",
    register: "S'inscrire",
    email: "Adresse e-mail",
    password: "Mot de passe",
    fullName: "Nom complet",
    username: "Nom d'utilisateur",
    signIn: "Connexion",
    signUp: "Inscription",
    logout: "Se déconnecter",
    noAccount: "Vous n'avez pas de compte ?",
    hasAccount: "Vous avez déjà un compte ?",
    // Navigation
    dashboard: "Tableau de bord",
    groups: "Groupes",
    history: "Historique",
    profile: "Profil",
    // Dashboard
    totalExpenses: "Dépenses totales",
    youPaid: "Vous avez payé",
    youOwe: "Vous devez",
    youAreOwed: "On vous doit",
    recentTransactions: "Transactions récentes",
    monthlyStats: "Statistiques mensuelles",
    noTransactions: "Aucune transaction enregistrée.",
    netBalance: "Solde net",
    settledUp: "Vous êtes totalement en règle !",
    owesYou: "vous doit",
    youOweUser: "vous devez à",
    // Groups
    createGroup: "Créer un groupe",
    groupName: "Nom du groupe",
    groupDesc: "Description du groupe",
    noGroups: "Aucun groupe trouvé. Créez-en un pour commencer !",
    members: "Membres",
    addMember: "Ajouter un membre",
    inviteLink: "Lien d'invitation",
    createdBy: "Créé par",
    inviteEmail: "Inviter par email/nom d'utilisateur",
    inviteSuccess: "Membre ajouté avec succès !",
    joinGroup: "Rejoindre le groupe",
    // Expenses
    addExpense: "Ajouter une dépense",
    expenseTitle: "Titre",
    expenseDesc: "Description",
    amount: "Montant",
    date: "Date",
    category: "Catégorie",
    paidBy: "Payé par",
    membersInvolved: "Membres impliqués",
    splitType: "Type de partage",
    equal: "Équitable",
    custom: "Montants exacts",
    percentage: "Pourcentage",
    receiptUpload: "Reçu (URL facultative)",
    save: "Enregistrer",
    cancel: "Annuler",
    settleDebt: "Régler la dette",
    settleUp: "Rembourser",
    historyFilters: "Filtres",
    search: "Rechercher...",
    // Categories
    food: "Restauration",
    transport: "Transport",
    rent: "Loyer & Charges",
    entertainment: "Divertissement",
    shopping: "Shopping",
    other: "Autre",
    // Notifications
    notifications: "Notifications",
    noNotifications: "Aucune nouvelle notification",
    markAllRead: "Tout marquer comme lu",
    // Added keys
    memberBalances: "Soldes des membres",
    simplifiedDebts: "Dettes simplifiées",
    getsBack: "Récupère",
    owes: "Doit",
    settledUpLabel: "En règle",
    noDescription: "Aucune description fournie.",
    balancesSimplified: "Les soldes sont simplifiés automatiquement pour minimiser les transferts.",
    paymentRecorded: "Paiement enregistré",
    payerFromUser: "Payeur (De)",
    recipientToUser: "Destinataire (À)",
    selectPayer: "Sélectionner le payeur",
    selectRecipient: "Sélectionner le destinataire",
    splitMethod: "Méthode de partage",
    selectMembersCost: "Sélectionner les membres partageant ce coût",
    inputExactAmounts: "Saisir les montants exacts dus",
    inputPercentage: "Saisir la part en pourcentage (%)",
    allSettled: "Tout est réglé !",
    remaining: "restant",
    overTotal: "au-dessus du total",
    pendingConfirmation: "En attente de confirmation",
    confirmed: "Confirmé",
    confirm: "Confirmer",
    reject: "Rejeter",
    acceptTransaction: "Accepter cette transaction ?",
    receipt: "Reçu",
    shareReceipt: "Partager le reçu",
    reimbursementReceipt: "Reçu de remboursement",
    shareMsg: "J'ai réglé mon remboursement de {amount} MAD dans le groupe '{group}' via Watch Guard ! 💸",
    copiedToClipboard: "Copié dans le presse-papiers !",
    download: "Télécharger",
    hello: "Bonjour",
    welcomeBack: "Bienvenue sur votre tableau de bord Watch Guard.",
    owedToOthers: "DÛ AUX AUTRES",
    settled: "RÉGLÉ",
    owedToYou: "DÛ À VOUS",
    inviteCodeLabel: "Code d'invitation",
    whatIsGroupFor: "À quoi sert ce groupe ?",
    enter8digit: "Saisir le code à 8 caractères (ex. A1B2C3D4)",
    viewDetails: "Voir les détails",
    completeTransactionList: "Liste complète des transactions. Filtrer, trier et rechercher.",
    filters: "Filtres",
    allGroups: "Tous les groupes",
    allCategories: "Toutes les catégories",
    newestFirst: "Le plus récent en premier",
    oldestFirst: "Le plus ancien en premier",
    highestAmount: "Montant le plus élevé",
    lowestAmount: "Montant le plus bas",
    startDate: "Date de début",
    endDate: "Date de fin",
    noMatchingRecords: "Aucun enregistrement correspondant trouvé.",
    paid: "a payé",
    paidUser: "a payé"
  },
  ar: {
    // Auth
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    username: "اسم المستخدم",
    signIn: "دخول",
    signUp: "تسجيل",
    logout: "تسجيل الخروج",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    // Navigation
    dashboard: "لوحة التحكم",
    groups: "المجموعات",
    history: "السجل",
    profile: "الملف الشخصي",
    // Dashboard
    totalExpenses: "إجمالي المصاريف",
    youPaid: "ما دفعته",
    youOwe: "ما تدينه",
    youAreOwed: "ما يُدان لك",
    recentTransactions: "المعاملات الأخيرة",
    monthlyStats: "الإحصاءات الشهرية",
    noTransactions: "لا توجد معاملات مسجلة بعد.",
    netBalance: "صافي الرصيد",
    settledUp: "لقد تم تسوية جميع ديونك!",
    owesYou: "يدين لك بـ",
    youOweUser: "أنت مدين لـ",
    // Groups
    createGroup: "إنشاء مجموعة",
    groupName: "اسم المجموعة",
    groupDesc: "وصف المجموعة",
    noGroups: "لم يتم العثور على مجموعات. أنشئ واحدة للبدء!",
    members: "الأعضاء",
    addMember: "إضافة عضو",
    inviteLink: "رابط الدعوة",
    createdBy: "أنشئت بواسطة",
    inviteEmail: "دعوة بالبريد الإلكتروني/اسم المستخدم",
    inviteSuccess: "تمت إضافة العضو بنجاح!",
    joinGroup: "الانضمام للمجموعة",
    // Expenses
    addExpense: "إضافة مصروف",
    expenseTitle: "العنوان",
    expenseDesc: "الوصف",
    amount: "المبلغ",
    date: "التاريخ",
    category: "الفئة",
    paidBy: "دفع بواسطة",
    membersInvolved: "الأعضاء المعنيون",
    splitType: "طريقة التقسيم",
    equal: "بالتساوي",
    custom: "مبالغ محددة",
    percentage: "نسبة مئوية",
    receiptUpload: "إيصال (رابط اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    settleDebt: "تسوية الدين",
    settleUp: "تسوية",
    historyFilters: "التصنيفات",
    search: "بحث...",
    // Categories
    food: "طعام وشراب",
    transport: "وسائل النقل",
    rent: "الإيجار والخدمات",
    entertainment: "الترفيه",
    shopping: "التسوق",
    other: "أخرى",
    // Notifications
    notifications: "الإشعارات",
    noNotifications: "لا توجد إشعارات جديدة",
    markAllRead: "تحديد الكل كمقروء",
    // Added keys
    memberBalances: "أرصدة الأعضاء",
    simplifiedDebts: "الديون المبسطة",
    getsBack: "يسترد",
    owes: "يدين بـ",
    settledUpLabel: "تمت التسوية",
    noDescription: "لا يوجد وصف للمجموعة.",
    balancesSimplified: "يتم تبسيط الأرصدة تلقائيًا لتقليل التحويلات المالية.",
    paymentRecorded: "تم تسجيل الدفع",
    payerFromUser: "الدافع (من)",
    recipientToUser: "المستلم (إلى)",
    selectPayer: "اختر الدافع",
    selectRecipient: "اختر المستلم",
    splitMethod: "طريقة التقسيم",
    selectMembersCost: "اختر الأعضاء المشاركين في التكلفة",
    inputExactAmounts: "أدخل المبالغ الدقيقة المستحقة",
    inputPercentage: "أدخل النسبة المئوية (%)",
    allSettled: "تمت تسوية كل شيء!",
    remaining: "متبقي",
    overTotal: "أكثر من المجموع",
    pendingConfirmation: "في انتظار التأكيد",
    confirmed: "مؤكد",
    confirm: "تأكيد",
    reject: "رفض",
    acceptTransaction: "قبول هذه المعاملة؟",
    receipt: "إيصال",
    shareReceipt: "مشاركة الإيصال",
    reimbursementReceipt: "إيصال السداد",
    shareMsg: "لقد قمت بتسوية سداد بقيمة {amount} درهم في مجموعة '{group}' عبر Watch Guard! 💸",
    copiedToClipboard: "تم النسخ إلى الحافظة!",
    download: "تحميل",
    hello: "مرحباً",
    welcomeBack: "مرحباً بك في لوحة تحكم Watch Guard الخاصة بك.",
    owedToOthers: "مستحق للآخرين",
    settled: "تمت التسوية",
    owedToYou: "مستحق لك",
    inviteCodeLabel: "رمز الدعوة",
    whatIsGroupFor: "ما هو الغرض من هذه المجموعة؟",
    enter8digit: "أدخل الرمز المكون من 8 أحرف (مثال: A1B2C3D4)",
    viewDetails: "عرض التفاصيل",
    completeTransactionList: "قائمة المعاملات الكاملة. الفرز والتصنيف والبحث.",
    filters: "التصنيفات",
    allGroups: "جميع المجموعات",
    allCategories: "جميع الفئات",
    newestFirst: "الأحدث أولاً",
    oldestFirst: "الأقدم أولاً",
    highestAmount: "المبلغ الأعلى",
    lowestAmount: "المبلغ الأقل",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    noMatchingRecords: "لم يتم العثور على سجلات مطابقة.",
    paid: "دفع",
    paidUser: "دفع لـ"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'fr' || saved === 'ar') return saved;
    return 'en';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    const htmlElement = window.document.documentElement;
    htmlElement.setAttribute('lang', language);
    if (isRtl) {
      htmlElement.setAttribute('dir', 'rtl');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
    }
    localStorage.setItem('language', language);
  }, [language, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
