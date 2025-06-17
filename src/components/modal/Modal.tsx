import React from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    hideClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, hideClose = false }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {!hideClose && <button className="modal-close" onClick={onClose}>×</button>}
                {children}
            </div>
        </div>
    );
};