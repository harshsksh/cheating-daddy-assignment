// Minimal cheddar API to keep main process integrations working while we migrate UI
import { ipcRenderer } from 'electron';

const cheddar = {
    element: () => null,
    e: () => null,
    getCurrentView: () => 'main',
    getLayoutMode: () => (localStorage.getItem('layoutMode') || 'normal'),
    setStatus: (text: string) => console.log('[status]', text),
    setResponse: (_: string) => {},
    initializeGemini: async (profile: string, language: string) => {
        const apiKey = localStorage.getItem('apiKey')?.trim();
        if (!apiKey) return false;
        return ipcRenderer.invoke('initialize-gemini', apiKey, localStorage.getItem('customPrompt') || '', profile, language);
    },
    startCapture: async (interval: string, imageQuality: string) => {
        // For now, call into legacy renderer implementation if present
        console.warn('startCapture stub called with', interval, imageQuality);
    },
    stopCapture: () => {},
    sendTextMessage: (text: string) => ipcRenderer.invoke('send-text-message', text),
    handleShortcut: (_: string) => {},
    getAllConversationSessions: async () => [],
    getConversationSession: async (_: string) => null,
    initConversationStorage: async () => {},
    getContentProtection: () => {
        const contentProtection = localStorage.getItem('contentProtection');
        return contentProtection !== null ? contentProtection === 'true' : true;
    },
    isLinux: process.platform === 'linux',
    isMacOS: process.platform === 'darwin',
};

// @ts-ignore
window.cheddar = cheddar as any;

export default cheddar;


