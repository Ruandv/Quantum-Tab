import React, { ReactNode } from 'react';
import styles from './modal.module.css';

export interface ModalAction {
    index: number;
    text: string;
    onClick: () => void;
    disabled?: boolean;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: { title?: string | React.ReactNode; content: ReactNode, actions?: ModalAction[]; };

}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    content,
}) => {
    if (!isOpen) return null;

    // Prevent click propagation from modal content to backdrop
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
            <section className={styles.modal} onClick={handleContentClick}>
                {content.title && (
                    <header className={styles.header}>
                        <h2>{content.title}</h2>
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close modal"
                            type="button"
                        >
                            &times;
                        </button>
                    </header>
                )}
                <main className={styles.body}>{content.content}</main>
                <footer className={styles.footer}>
                    {content.actions &&
                        [...content.actions]
                            .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                            .map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={styles.actionButton}
                                    type="button"
                                >
                                    {action.text}
                                </button>
                            ))}
                </footer>
            </section>
        </div>
    );
};

export default Modal;