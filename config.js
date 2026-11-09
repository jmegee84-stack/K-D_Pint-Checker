/* Pint Checker settings. Fill in the two Supabase values (see SETUP.md, step 2).
   The anon key is designed to be public: the database rules protect the data. */
window.PINT = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  /* Turn Apple on only after you have set it up in Supabase (SETUP.md, step 4). */
  providers: { google: true, apple: false, email: true }
};
