import { Language } from "../types";

export const translations = {
  en: {
    // Auth
    welcome_back: "Welcome Back",
    create_account: "Create Account",
    guest_mode: "Continue as Guest",
    guest_warning: "Guest Mode Active. Data is stored locally. Sign up to save data to cloud.",
    
    // Sidebar
    nav_strategy: "Find Clients",
    nav_leads: "Lead Database",
    nav_dashboard: "Stats & Analytics",
    nav_community: "Community",
    nav_profile: "My Profile",
    nav_admin: "Admin Panel",
    btn_signout: "Sign Out",
    btn_report: "Report Issue",
    btn_donate: "Support/Donate",

    // Strategy Generator
    strat_title: "Define Your Target",
    strat_role: "I work as a...",
    strat_platform: "Platform",
    strat_location: "Target Location",
    strat_client: "Ideal Client Persona",
    strat_niche: "Target Niche",
    strat_bio: "My Professional Profile / Resume Summary",
    strat_bio_hint: "(Used as Benchmark)",
    strat_btn_generate: "Generate Extensive Search Strategy",
    strat_btn_import: "Import from CV",
    strat_btn_suggest: "Suggest Bio",
    strat_results_keywords: "Search Keywords",
    strat_results_tips: "AI Pro Tips",

    // Lead Manager
    leads_title: "Lead Database",
    leads_btn_add: "Add Lead",
    leads_scan_title: "Magic Scan: Screenshots or Recording",
    leads_scan_btn: "Scan Files",
    leads_analyze_btn: "Analyze Fit",
    leads_outreach_btn: "Generate Outreach Strategy",
    
    // Errors
    err_quota: "⚠️ High Traffic / Limit Reached. The AI is currently busy. Please wait 1 minute and try again.",
    err_config: "⚠️ Configuration Error. Please contact admin to check API Key settings.",
    err_safety: "⚠️ AI Safety Block. The content generated was flagged. Please modify your inputs.",
    err_generic: "⚠️ AI Service Error: ",
  },
  id: {
    // Auth
    welcome_back: "Selamat Datang Kembali",
    create_account: "Buat Akun Baru",
    guest_mode: "Lanjut sebagai Tamu",
    guest_warning: "Mode Tamu Aktif. Data tersimpan di browser. Daftar untuk menyimpan ke cloud.",

    // Sidebar
    nav_strategy: "Cari Klien",
    nav_leads: "Database Prospek",
    nav_dashboard: "Statistik",
    nav_community: "Komunitas",
    nav_profile: "Profil Saya",
    nav_admin: "Panel Admin",
    btn_signout: "Keluar",
    btn_report: "Lapor Masalah",
    btn_donate: "Dukung/Donasi",

    // Strategy Generator
    strat_title: "Tentukan Target Anda",
    strat_role: "Saya bekerja sebagai...",
    strat_platform: "Platform",
    strat_location: "Lokasi Target",
    strat_client: "Persona Klien Ideal",
    strat_niche: "Target Niche/Pasar",
    strat_bio: "Profil Profesional / Ringkasan CV Saya",
    strat_bio_hint: "(Digunakan sebagai Tolok Ukur)",
    strat_btn_generate: "Buat Strategi Pencarian",
    strat_btn_import: "Impor dari CV",
    strat_btn_suggest: "Saran Bio",
    strat_results_keywords: "Kata Kunci Pencarian",
    strat_results_tips: "Tips Pro AI",

    // Lead Manager
    leads_title: "Database Prospek",
    leads_btn_add: "Tambah Prospek",
    leads_scan_title: "Magic Scan: Screenshot atau Rekaman Layar",
    leads_scan_btn: "Scan File",
    leads_analyze_btn: "Analisis Kecocokan",
    leads_outreach_btn: "Buat Pesan Penawaran",

    // Errors
    err_quota: "⚠️ Trafik Tinggi / Limit Tercapai. AI sedang sibuk. Mohon tunggu 1 menit lalu coba lagi.",
    err_config: "⚠️ Error Konfigurasi. Hubungi admin untuk cek API Key.",
    err_safety: "⚠️ Blokir Keamanan AI. Konten ditandai tidak aman. Mohon ubah input Anda.",
    err_generic: "⚠️ Error Layanan AI: ",
  }
};

export const getTranslation = (lang: Language, key: keyof typeof translations['en']) => {
  return translations[lang][key] || translations['en'][key] || key;
};

export const getFriendlyErrorMessage = (error: any, lang: Language) => {
  const rawMsg = error?.message || String(error);
  
  if (rawMsg.includes('429') || rawMsg.includes('Quota exceeded') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return translations[lang].err_quota;
  }
  if (rawMsg.includes('API key') || rawMsg.includes('403')) {
    return translations[lang].err_config;
  }
  if (rawMsg.includes('candidate')) {
      return translations[lang].err_safety;
  }
  return translations[lang].err_generic + (rawMsg.length > 50 ? (lang === 'id' ? "Permintaan gagal. Coba lagi." : "Request failed. Please try again.") : rawMsg);
};
