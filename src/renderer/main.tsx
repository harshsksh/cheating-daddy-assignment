import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ipcRenderer } from 'electron';
import './cheddar';

type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    text: string;
};

function Header() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2b2b2f', background: 'rgba(20,20,22,0.85)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.7)' }} />
                <div style={{ color: '#fafafa', fontWeight: 600 }}>Cheating Daddy</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => ipcRenderer.invoke('toggle-window-visibility')} style={btn('ghost')}>Hide</button>
                <button onClick={() => ipcRenderer.invoke('quit-application')} style={btn('danger')}>Quit</button>
            </div>
        </div>
    );
}

function btn(variant: 'primary' | 'ghost' | 'danger' = 'primary') {
    const base: React.CSSProperties = {
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #2b2b2f',
        background: '#1f1f23',
        color: '#e5e5e7',
        cursor: 'pointer',
        fontSize: 13,
    };
    if (variant === 'ghost') return { ...base, background: 'transparent' };
    if (variant === 'danger') return { ...base, background: '#3a1a1a', borderColor: '#5c2323', color: '#ffb4b4' };
    return base;
}

function Toolbar({ onSend, onStart, onStop }: { onSend: (text: string) => void; onStart: () => void; onStop: () => void }) {
    const [text, setText] = useState('');

    const send = useCallback(() => {
        const value = text.trim();
        if (!value) return;
        onSend(value);
        setText('');
    }, [text, onSend]);

    return (
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #2b2b2f' }}>
            <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                    }
                }}
                placeholder="Type a prompt and press Enter"
                style={{ flex: 1, background: '#0f0f12', color: '#e5e5e7', border: '1px solid #2b2b2f', borderRadius: 8, padding: '10px 12px', outline: 'none' }}
            />
            <button onClick={send} style={btn()}>Send</button>
            <button onClick={onStart} style={btn('ghost')}>Start</button>
            <button onClick={onStop} style={btn('ghost')}>Stop</button>
        </div>
    );
}

function Settings() {
    const [contentProtection, setContentProtection] = useState<boolean>(() => cheddar.getContentProtection());
    const [layoutMode, setLayoutMode] = useState<string>(() => localStorage.getItem('layoutMode') || 'normal');

    useEffect(() => {
        localStorage.setItem('contentProtection', String(contentProtection));
        ipcRenderer.invoke('update-content-protection', contentProtection);
    }, [contentProtection]);

    useEffect(() => {
        localStorage.setItem('layoutMode', layoutMode);
        ipcRenderer.invoke('update-sizes');
    }, [layoutMode]);

    return (
        <div style={{ display: 'flex', gap: 16, padding: 12, alignItems: 'center', borderBottom: '1px solid #2b2b2f', background: '#121216' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c9c9ce' }}>
                <input type="checkbox" checked={contentProtection} onChange={e => setContentProtection(e.target.checked)} />
                Content protection
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c9c9ce' }}>
                <span>Layout</span>
                <select value={layoutMode} onChange={e => setLayoutMode(e.target.value)} style={{ background: '#0f0f12', color: '#e5e5e7', border: '1px solid #2b2b2f', borderRadius: 8, padding: '6px 8px' }}>
                    <option value="normal">Normal</option>
                    <option value="compact">Compact</option>
                </select>
            </div>
        </div>
    );
}

function Messages({ items }: { items: Message[] }) {
    const listRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [items.length]);
    return (
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(m => (
                <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ fontSize: 11, color: '#8b8b90', marginBottom: 4 }}>{m.role.toUpperCase()}</div>
                    <div style={{ background: m.role === 'user' ? '#1b2a3a' : '#19191d', border: '1px solid #2b2b2f', color: '#e5e5e7', padding: '10px 12px', borderRadius: 12, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
            ))}
        </div>
    );
}

function App() {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const handler = (_: any, data: any) => {
            if (data === 'navigate-previous-response' || data === 'navigate-next-response' || data === 'scroll-response-up' || data === 'scroll-response-down') {
                return; // ignore nav for now
            }
        };
        ipcRenderer.on('message', handler);
        return () => {
            ipcRenderer.removeListener('message', handler);
        };
    }, []);

    const addMessage = useCallback((role: Message['role'], text: string) => {
        setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role, text }]);
    }, []);

    const onSend = useCallback(async (text: string) => {
        addMessage('user', text);
        try {
            await cheddar.sendTextMessage(text);
            addMessage('assistant', 'Message sent to backend.');
        } catch (e) {
            addMessage('system', 'Failed to send message.');
        }
    }, [addMessage]);

    const onStart = useCallback(async () => {
        addMessage('system', 'Starting capture…');
        await cheddar.startCapture('2000', 'medium');
    }, [addMessage]);

    const onStop = useCallback(() => {
        addMessage('system', 'Stopping capture.');
        cheddar.stopCapture();
    }, [addMessage]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(8,8,10,0.8)' }}>
            <Header />
            <Settings />
            <Messages items={messages} />
            <Toolbar onSend={onSend} onStart={onStart} onStop={onStop} />
        </div>
    );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);


