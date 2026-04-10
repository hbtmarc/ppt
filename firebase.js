/* ============================================
   FIREBASE SERVICE MODULE
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    set,
    push,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

/* ── Configuração ── */
const firebaseConfig = {
    apiKey:            "AIzaSyAuZ_RWLLn26CqUy3zpyz75_IuQSVQti2k",
    authDomain:        "projectshub-marc35.firebaseapp.com",
    databaseURL:       "https://projectshub-marc35-default-rtdb.firebaseio.com",
    projectId:         "projectshub-marc35",
    storageBucket:     "projectshub-marc35.firebasestorage.app",
    messagingSenderId: "949883815683",
    appId:             "1:949883815683:web:51361aeb09e7d7a3b34b36",
    measurementId:     "G-NL76HRZZ6M"
};

/* ── Inicializar — envolvido em try/catch para falha não silenciosa ── */
let app, auth, db;
try {
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getDatabase(app);
    // Analytics é opcional — não impede o resto se o projeto não tiver ativado
    try { getAnalytics(app); } catch (_) {}
} catch (initErr) {
    console.error('[Firebase] Falha na inicialização:', initErr);
    window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { error: initErr.message } }));
    throw initErr;
}

/* ── Estrutura do banco:
  /presentations/{id}/
    title: string
    description: string
    author: string
    theme: string
    createdAt: timestamp
    updatedAt: timestamp
    slides/{id}/
      order: number
      title: string
      content: string (HTML)

  /admins/{uid}: true
── */

/* ── Utilitários ── */
function now() { return Date.now(); }

/* ============================================
   AUTH
   ============================================ */
const Auth = {
    currentUser: null,
    isAdmin: false,
    listeners: [],

    onStateChange(callback) {
        this.listeners.push(callback);
        // Retorna o usuário atual imediatamente
        if (this.currentUser !== undefined) {
            callback(this.currentUser, this.isAdmin);
        }
    },

    _notifyListeners() {
        this.listeners.forEach(cb => {
            try { cb(this.currentUser, this.isAdmin); } catch (_) {}
        });
    },

    async login(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    },

    async logout() {
        await signOut(auth);
    }
};

// Monitorar estado de auth e verificar se é admin
onAuthStateChanged(auth, async (user) => {
    Auth.currentUser = user;
    Auth.isAdmin = false;

    if (user) {
        try {
            const adminRef = ref(db, `admins/${user.uid}`);
            const snap = await get(adminRef);
            Auth.isAdmin = snap.exists() && snap.val() === true;
        } catch (_) {
            Auth.isAdmin = false;
        }
    }

    Auth._notifyListeners();
});

/* ============================================
   PRESENTATIONS — CRUD
   ============================================ */
const Presentations = {
    /** Listar todas as apresentações */
    async list() {
        const snap = await get(ref(db, 'presentations'));
        if (!snap.exists()) return [];
        const data = snap.val();
        return Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    },

    /** Buscar uma apresentação com seus slides */
    async get(id) {
        const snap = await get(ref(db, `presentations/${id}`));
        if (!snap.exists()) return null;
        return { id, ...snap.val() };
    },

    /** Criar nova apresentação */
    async create(data) {
        const newRef = push(ref(db, 'presentations'));
        const payload = {
            title: data.title || 'Nova Apresentação',
            description: data.description || '',
            author: data.author || '',
            brand: data.brand || '',
            theme: data.theme || 'default',
            createdAt: now(),
            updatedAt: now(),
            slides: {}
        };
        await set(newRef, payload);
        return newRef.key;
    },

    /** Atualizar metadados */
    async update(id, data) {
        const updates = { ...data, updatedAt: now() };
        delete updates.slides; // slides gerenciados separadamente
        delete updates.id;
        await update(ref(db, `presentations/${id}`), updates);
    },

    /** Excluir apresentação (somente admin) */
    async delete(id) {
        await remove(ref(db, `presentations/${id}`));
    }
};

/* ============================================
   SLIDES — CRUD
   ============================================ */
const Slides = {
    /** Listar slides ordenados */
    async list(presentationId) {
        const snap = await get(ref(db, `presentations/${presentationId}/slides`));
        if (!snap.exists()) return [];
        return Object.entries(snap.val())
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    },

    /** Adicionar slide */
    async add(presentationId, slideData) {
        const existing = await this.list(presentationId);
        const order = existing.length + 1;
        const newRef = push(ref(db, `presentations/${presentationId}/slides`));
        await set(newRef, {
            title: slideData.title || `Slide ${order}`,
            content: slideData.content || '',
            slideClasses: slideData.slideClasses || '',
            order
        });
        await update(ref(db, `presentations/${presentationId}`), { updatedAt: now() });
        return newRef.key;
    },

    /** Atualizar slide */
    async update(presentationId, slideId, data) {
        await update(ref(db, `presentations/${presentationId}/slides/${slideId}`), data);
        await update(ref(db, `presentations/${presentationId}`), { updatedAt: now() });
    },

    /** Excluir slide */
    async delete(presentationId, slideId) {
        await remove(ref(db, `presentations/${presentationId}/slides/${slideId}`));
        // Reordenar
        const remaining = await this.list(presentationId);
        for (let i = 0; i < remaining.length; i++) {
            await update(ref(db, `presentations/${presentationId}/slides/${remaining[i].id}`), { order: i + 1 });
        }
        await update(ref(db, `presentations/${presentationId}`), { updatedAt: now() });
    },

    /** Reordenar slides (recebe array de ids na nova ordem) */
    async reorder(presentationId, orderedIds) {
        const updates = {};
        orderedIds.forEach((id, i) => {
            updates[`presentations/${presentationId}/slides/${id}/order`] = i + 1;
        });
        updates[`presentations/${presentationId}/updatedAt`] = now();
        await update(ref(db), updates);
    }
};

/* ── Expor globalmente ── */
window.FirebaseService = { Auth, Presentations, Slides };

// Notifica script.js via CustomEvent — funciona tanto antes quanto depois do DOMContentLoaded
// script.js também verifica window.FirebaseService diretamente caso o evento já tenha disparado
window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { ok: true } }));

console.log('%c🔥 Firebase conectado', 'color:#f97316;font-weight:bold;');
