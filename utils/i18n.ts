import { Language } from "../types";

export const translations = {
  en: {
    // Auth
    welcome_back: "Welcome Back",
    create_account: "Create Account",
    forgot_password_title: "Reset Your Password",
    forgot_password_link: "Forgot password?",
    back_to_login: "Back to Login",
    reset_instructions: "Enter your email address and we'll send you a link to reset your password.",
    btn_send_reset: "Send Reset Link",
    reset_success: "Password reset link sent! Please check your email inbox.",
    
    // New Password Form
    reset_password_now_title: "Create New Password",
    new_password_label: "New Password",
    confirm_password_label: "Confirm New Password",
    btn_update_password: "Update Password",
    update_password_success: "Password updated successfully! You can now login.",
    passwords_not_match: "Passwords do not match.",

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
    leads_reanalyze_btn: "Re-analyze Fit",
    leads_outreach_btn: "Generate Outreach Strategy",

    // Profile
    prof_title: "My Professional Profile",
    prof_subtitle: "This data is used by AI to analyze leads and generate outreach messages.",
    prof_section_account: "Account & Security",
    prof_email_label: "Email Address",
    prof_email_hint: "Changing email requires verification.",
    prof_pass_label: "New Password",
    prof_pass_confirm: "Confirm New Password",
    prof_pass_hint: "Leave blank to keep current password.",
    prof_success: "Profile updated successfully!",
    prof_pass_success: "Password updated successfully!",
    prof_err_match: "Passwords do not match.",
    
    // Errors
    err_quota: "⚠️ High Traffic / Limit Reached. The AI is currently busy. Please wait 1 minute and try again.",
    err_config: "⚠️ Configuration Error. Please contact admin to check API Key settings.",
    err_safety: "⚠️ AI Safety Block. The content generated was flagged. Please modify your inputs.",
    err_generic: "⚠️ AI Service Error: ",

    // CV Matcher
    cv_title: "AI CV Matcher",
    cv_subtitle: "Upload your CV and a job description to instantly calculate your match score and get AI-powered improvement tips.",
    cv_step_1: "Upload Your CV",
    cv_parsed: "Parsed ✓",
    cv_upload_click: "Click to upload CV",
    cv_file_types: "PDF, DOCX, PNG, JPG",
    cv_step_2: "Target Job Post",
    cv_paste_text: "Paste Text",
    cv_paste_link: "Paste Link",
    cv_link_hint: "Some sites block auto-fetching. Switch to Paste Text if it fails.",
    cv_placeholder_job: "Paste the full job description here...",
    cv_err_title: "Analysis Failed",
    cv_analyzing: "Analyzing...",
    cv_reanalyze: "Re-Analyze",
    cv_btn_calculate: "Calculate Match Rate",
    cv_match_score: "Match Score",
    cv_insights: "Recruiter Insights",
    cv_matching: "Matching",
    cv_none: "None detected",
    cv_missing: "Missing",
    cv_perfect: "Perfect match! 🎉",
    cv_advice: "Actionable Advice",
    cv_empty_title: "Results will appear here",
    cv_empty_subtitle: "Upload your CV and paste a job description, then hit **Calculate Match Rate**.",
    cv_workspace_title: "AI Resume Optimization",
    cv_btn_restructure: "Optimize Flow",
    cv_btn_tailor: "Tailor to Job",
    cv_output_label: "Optimized Resume",
    cv_btn_copy: "Copy Resume",
    cv_copy_success: "Resume copied to clipboard!",

    // Guide / How It Works
    guide_title: "Getting Started Guide",
    guide_subtitle: "Learn how to maximize your outreach and job applications with AI.",
    guide_leads_tab: "Leads to Outreach",
    guide_cv_tab: "AI CV Matcher",

    guide_leads_step1_title: "1. Add Your Leads",
    guide_leads_step1_desc: "Click '+ Add Lead'. Use 'Magic Scan' to auto-extract info from screenshots or screen recordings of profiles.",
    guide_leads_step2_title: "2. AI Analysis",
    guide_leads_step2_desc: "Click the Brain icon. AI compares the lead to your bio/resume and gives a match score (0-100).",
    guide_leads_step3_title: "3. Outreach Strategy",
    guide_leads_step3_desc: "Choose a tone and length. AI generates a personalized message based on the lead's pain points.",
    guide_leads_step4_title: "4. Refine & Send",
    guide_leads_step4_desc: "Use 'AI Edit' to tweak the message. Copy and send it directly to their profile!",

    guide_cv_step1_title: "1. Upload Your CV",
    guide_cv_step1_desc: "Upload PDF or image. Our AI will instantly parse your skills and experience.",
    guide_cv_step2_title: "2. Paste Job Link/Text",
    guide_cv_step2_desc: "Paste the job description. AI analyzes what the recruiter is looking for.",
    guide_cv_step3_title: "3. Get Match Score",
    guide_cv_step3_desc: "See your match percentage, missing skills, and detailed recruiter insights.",
    guide_cv_step4_title: "4. Optimize with AI",
    guide_cv_step4_desc: "Use 'Tailor to Job' to automatically rewrite your CV for a perfect fit.",
    
    nav_guide: "How It Works",
  },
  id: {
    // Auth
    welcome_back: "Selamat Datang Kembali",
    create_account: "Buat Akun Baru",
    forgot_password_title: "Reset Kata Sandi",
    forgot_password_link: "Lupa kata sandi?",
    back_to_login: "Kembali ke Login",
    reset_instructions: "Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi Anda.",
    btn_send_reset: "Kirim Tautan Reset",
    reset_success: "Tautan reset kata sandi telah dikirim! Silakan periksa kotak masuk email Anda.",

    // New Password Form
    reset_password_now_title: "Buat Password Baru",
    new_password_label: "Password Baru",
    confirm_password_label: "Konfirmasi Password Baru",
    btn_update_password: "Update Password",
    update_password_success: "Password berhasil diperbarui! Sekarang Anda bisa login.",
    passwords_not_match: "Password tidak cocok.",

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
    leads_reanalyze_btn: "Analisis Ulang",
    leads_outreach_btn: "Buat Pesan Penawaran",

    // Profile
    prof_title: "Profil Profesional Saya",
    prof_subtitle: "Data ini digunakan AI untuk menganalisis prospek dan membuat pesan penawaran.",
    prof_section_account: "Akun & Keamanan",
    prof_email_label: "Alamat Email",
    prof_email_hint: "Ganti email memerlukan verifikasi ulang.",
    prof_pass_label: "Password Baru",
    prof_pass_confirm: "Konfirmasi Password Baru",
    prof_pass_hint: "Kosongkan jika tidak ingin ganti password.",
    prof_success: "Profil berhasil diperbarui!",
    prof_pass_success: "Password berhasil diperbarui!",
    prof_err_match: "Password tidak cocok.",

    // Errors
    err_quota: "⚠️ Trafik Tinggi / Limit Tercapai. AI sedang sibuk. Mohon tunggu 1 menit lalu coba lagi.",
    err_config: "⚠️ Error Konfigurasi. Hubungi admin untuk cek API Key.",
    err_safety: "⚠️ Blokir Keamanan AI. Konten ditandai tidak aman. Mohon ubah input Anda.",
    err_generic: "⚠️ Error Layanan AI: ",

    // CV Matcher
    cv_title: "AI CV Matcher",
    cv_subtitle: "Unggah CV dan deskripsi pekerjaan untuk menghitung skor kecocokan secara instan dan dapatkan tips perbaikan bertenaga AI.",
    cv_step_1: "Unggah CV Anda",
    cv_parsed: "Terbaca ✓",
    cv_upload_click: "Klik untuk unggah CV",
    cv_file_types: "PDF, DOCX, PNG, JPG",
    cv_step_2: "Target Lowongan",
    cv_paste_text: "Tempel Teks",
    cv_paste_link: "Tempel Link",
    cv_link_hint: "Beberapa situs memblokir pengambilan otomatis. Gunakan mode Tempel Teks jika gagal.",
    cv_placeholder_job: "Tempel deskripsi lengkap lowongan di sini...",
    cv_err_title: "Analisis Gagal",
    cv_analyzing: "Sedang Menganalisis...",
    cv_reanalyze: "Analisis Ulang",
    cv_btn_calculate: "Hitung Skor Kecocokan",
    cv_match_score: "Skor Kecocokan",
    cv_insights: "Wawasan Perekrut",
    cv_matching: "Cocok",
    cv_none: "Tidak terdeteksi",
    cv_missing: "Kurang",
    cv_perfect: "Sangat Cocok! 🎉",
    cv_advice: "Saran Tindakan",
    cv_empty_title: "Hasil akan muncul di sini",
    cv_empty_subtitle: "Unggah CV Anda dan tempel deskripsi pekerjaan, lalu klik **Hitung Skor Kecocokan**.",
    cv_workspace_title: "Optimasi Resume AI",
    cv_btn_restructure: "Rapikan Struktur",
    cv_btn_tailor: "Sesuaikan ke Loker",
    cv_output_label: "Resume Hasil Optimasi",
    cv_btn_copy: "Salin Resume",
    cv_copy_success: "Resume berhasil disalin!",

    // Guide / How It Works
    guide_title: "Panduan Memulai",
    guide_subtitle: "Pelajari cara memaksimalkan outreach dan lamaran kerja Anda dengan AI.",
    guide_leads_tab: "Alur Prospek",
    guide_cv_tab: "AI CV Matcher",

    guide_leads_step1_title: "1. Tambah Prospek",
    guide_leads_step1_desc: "Klik '+ Tambah Prospek'. Gunakan 'Magic Scan' untuk ekstrak info dari screenshot atau rekaman profil.",
    guide_leads_step2_title: "2. Analisis AI",
    guide_leads_step2_desc: "Klik ikon Otak. AI membandingkan prospek dengan bio/resume Anda untuk memberi skor kecocokan.",
    guide_leads_step3_title: "3. Strategi Outreach",
    guide_leads_step3_desc: "Pilih tone dan panjang pesan. AI buat pesan personal berdasarkan masalah (*pain points*) klien.",
    guide_leads_step4_title: "4. Edit & Kirim",
    guide_leads_step4_desc: "Gunakan 'AI Edit' untuk revisi. Salin dan kirim langsung ke profil klien!",

    guide_cv_step1_title: "1. Unggah CV Anda",
    guide_cv_step1_desc: "Unggah PDF atau gambar. AI kami akan langsung membaca skill dan pengalaman Anda.",
    guide_cv_step2_title: "2. Tempel Loker",
    guide_cv_step2_desc: "Tempel deskripsi lowongan. AI menganalisis apa yang dicari oleh perekrut.",
    guide_cv_step3_title: "3. Cek Skor Cocok",
    guide_cv_step3_desc: "Lihat persentase kecocokan, skill yang kurang, dan wawasan mendalam dari kacamata perekrut.",
    guide_cv_step4_title: "4. Optimasi AI",
    guide_cv_step4_desc: "Gunakan 'Sesuaikan ke Loker' untuk menulis ulang CV Anda agar sangat pas dengan lowongan tersebut.",
    
    nav_guide: "Cara Kerja",
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