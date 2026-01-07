import { supabase } from '../lib/supabase';

export const dataService = {
    // --- Auth ---

    async signInWithEmail(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Redirect to URL where the app is hosted
                emailRedirectTo: window.location.origin,
            },
        });
        return { data, error };
    },

    async signUpWithPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    },

    async signInWithPassword(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // --- Timesheet Entries ---

    /**
     * Fetch all timesheet entries for a user (or current logged in user)
     */
    async getEntries(userId) {
        try {
            // If no userId, maybe fetch for current user?
            // But TimesheetTable passes userId.
            const { data, error } = await supabase
                .from('timesheets')
                .select('date_key, data')
                .eq('user_id', userId);

            if (error) throw error;

            // Transform [{date_key: "...", data: {...}}, ...] to {"...": {...}}
            const entriesMap = {};
            data.forEach(row => {
                entriesMap[row.date_key] = row.data;
            });

            return entriesMap;
        } catch (error) {
            console.error('Error fetching entries:', error);
            return {};
        }
    },

    /**
     * Save a single day's entry
     * @param {string} userId 
     * @param {string} dateKey 
     * @param {Object} dayData 
     */
    async saveEntry(userId, dateKey, dayData) {
        try {
            const { error } = await supabase
                .from('timesheets')
                .upsert({
                    user_id: userId,
                    date_key: dateKey,
                    data: dayData
                }, { onConflict: 'user_id, date_key' });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving entry:', error);
            return false;
        }
    },

    // Deprecated full-save (kept for safety, but we should move away from it)
    async saveEntries(userId, entries) {
        console.warn("saveEntries (bulk) is deprecated. Use saveEntry (single) for DB efficiency.");
        return true;
    },

    // --- Users / Profiles ---

    // With Supabase, we don't manually manage a "users" list in local storage.
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
            return data;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    },

    async updateProfile(userId, updates) {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: userId, ...updates });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    },

    // --- Settings ---

    getTheme() {
        return localStorage.getItem('app_theme') || 'light';
    },

    saveTheme(theme) {
        localStorage.setItem('app_theme', theme);
    },

    /**
     * Generate a unique ID (UUID wrapper)
     */
    generateId() {
        return crypto.randomUUID();
    }
};
