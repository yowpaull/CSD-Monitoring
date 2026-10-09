'use client';

import { ToastContainer } from 'react-toastify';

export default function Toaster() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            closeButton
            limit={4}
            aria-label="Notifications"
        />
    );
}
