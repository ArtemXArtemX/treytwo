import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'anthropometry' | 'special'>('general');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [deleteStep, setDeleteStep] = useState<number>(1);
    const [deleteConfirmations, setDeleteConfirmations] = useState({
        understandConsequences: false,
        enterPassword: false,
        typeDelete: false,
        finalConfirm: false
    });
    const [deletePassword, setDeletePassword] = useState<string>('');

    const [heartRateZones] = useState([
        { id: 1, min: 0, max: 0 },
        { id: 2, min: 0, max: 0 },
        { id: 3, min: 0, max: 0 },
        { id: 4, min: 0, max: 0 },
        { id: 5, min: 0, max: 0 }
    ]);

    const handleDeleteConfirmation = (step: keyof typeof deleteConfirmations) => {
        setDeleteConfirmations(prev => ({
            ...prev,
            [step]: !prev[step]
        }));
    };

    const handleDeleteAccount = () => {
        if (deleteStep < 3) {
            setDeleteStep(prev => prev + 1);
        } else {
            console.log('Удаление аккаунта...');
            alert('Аккаунт удален');
            navigate('/');
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
            <Header />

            <div className="container py-4">
                <div className="row">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'general' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('general')}
                                        style={{
                                            backgroundColor: activeTab === 'general' ? '#D1001C' : 'transparent',
                                            color: activeTab === 'general' ? 'white' : '#333',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            width: '100%',
                                            borderRadius: activeTab === 'general' ? '12px' : '0'
                                        }}
                                    >
                                        Общая информация
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'security' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('security')}
                                        style={{
                                            backgroundColor: activeTab === 'security' ? '#D1001C' : 'transparent',
                                            color: activeTab === 'security' ? 'white' : '#333',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            width: '100%',
                                            borderRadius: activeTab === 'security' ? '12px' : '0'
                                        }}
                                    >
                                        Безопасность
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'anthropometry' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('anthropometry')}
                                        style={{
                                            backgroundColor: activeTab === 'anthropometry' ? '#D1001C' : 'transparent',
                                            color: activeTab === 'anthropometry' ? 'white' : '#333',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            width: '100%',
                                            borderRadius: activeTab === 'anthropometry' ? '12px' : '0'
                                        }}
                                    >
                                        Антропометрические данные
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'special' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('special')}
                                        style={{
                                            backgroundColor: activeTab === 'special' ? '#D1001C' : 'transparent',
                                            color: activeTab === 'special' ? 'white' : '#333',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            width: '100%',
                                            borderRadius: activeTab === 'special' ? '12px' : '0'
                                        }}
                                    >
                                        Особые действия
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="d-grid">
                            <button
                                onClick={() => navigate('/profile')}
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontWeight: 500,
                                    backgroundColor: "transparent",
                                    color: "#6c757d",
                                    border: "1px solid #6c757d",
                                    cursor: "pointer",
                                    outline: "none",
                                    boxShadow: "none",
                                    width: '100%'
                                }}
                            >
                                Вернуться в профиль
                            </button>
                        </div>
                    </div>

                    <div className="col-md-9">
                        {activeTab === 'general' && (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 style={{ color: "#1a1a1a", fontWeight: 600, margin: 0 }}>
                                            Общая информация
                                        </h5>
                                        <button
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                fontWeight: 500,
                                                backgroundColor: "#f8f9fa",
                                                color: "#6c757d",
                                                border: "1px solid #6c757d",
                                                cursor: "default"
                                            }}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            Редактировать
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Фамилия
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Имя
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Отчество
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Email
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Логин
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Дата рождения
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пол
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 style={{ color: "#1a1a1a", fontWeight: 600, margin: 0 }}>
                                            Безопасность
                                        </h5>
                                        <button
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                fontWeight: 500,
                                                backgroundColor: "#f8f9fa",
                                                color: "#6c757d",
                                                border: "1px solid #6c757d",
                                                cursor: "default"
                                            }}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            Редактировать
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Текущий пароль
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                style={{
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "8px",
                                                    padding: "10px 15px"
                                                }}
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3"></div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Новый пароль
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                style={{
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "8px",
                                                    padding: "10px 15px"
                                                }}
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Подтверждение пароля
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                style={{
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "8px",
                                                    padding: "10px 15px"
                                                }}
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-md-12 mt-4">
                                            <button
                                                style={{
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    fontWeight: 500,
                                                    padding: '10px 30px',
                                                    borderRadius: "8px",
                                                    border: "1px solid #6c757d",
                                                    cursor: "default"
                                                }}
                                            >
                                                Изменить пароль
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'anthropometry' && (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 style={{ color: "#1a1a1a", fontWeight: 600, margin: 0 }}>
                                            Антропометрические данные
                                        </h5>
                                        <button
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                fontWeight: 500,
                                                backgroundColor: "#f8f9fa",
                                                color: "#6c757d",
                                                border: "1px solid #6c757d",
                                                cursor: "default"
                                            }}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            Редактировать
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Рост (см)
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Вес (кг)
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пульс покоя (уд/мин)
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Максимальный пульс (уд/мин)
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Максимальный темп (мин/км)
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                Не указано
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-top">
                                        <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                            Пульсовые зоны
                                        </h6>
                                        <div className="table-responsive">
                                            <table
                                                className="table"
                                                style={{
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "8px",
                                                    tableLayout: "fixed"
                                                }}
                                            >
                                                <thead style={{ backgroundColor: "#f8f9fa" }}>
                                                <tr>
                                                    <th style={{
                                                        color: "#666",
                                                        fontWeight: 500,
                                                        padding: "12px 15px",
                                                        border: "none",
                                                        width: "50%",
                                                        textAlign: "left"
                                                    }}>
                                                        Зона
                                                    </th>
                                                    <th style={{
                                                        color: "#666",
                                                        fontWeight: 500,
                                                        padding: "12px 15px",
                                                        border: "none",
                                                        width: "50%",
                                                        textAlign: "left"
                                                    }}>
                                                        Диапазон (уд/мин)
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {heartRateZones.map((zone) => (
                                                    <tr key={zone.id} style={{ borderTop: "1px solid #e7eaf0" }}>
                                                        <td style={{
                                                            padding: "12px 15px",
                                                            color: "#1a1a1a",
                                                            fontWeight: 500,
                                                            width: "50%",
                                                            textAlign: "left"
                                                        }}>
                                                            Зона {zone.id}
                                                        </td>
                                                        <td style={{
                                                            padding: "12px 15px",
                                                            color: "#1a1a1a",
                                                            width: "50%",
                                                            textAlign: "left"
                                                        }}>
                                                            {zone.min} - {zone.max} уд/мин
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                        <h6 style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "15px" }}>
                                            Расчетные показатели
                                        </h6>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <span style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '5px' }}>Индекс массы тела (ИМТ):</span>
                                                    <div style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '16px' }}>
                                                        —
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <span style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '5px' }}>Резерв пульса:</span>
                                                    <div style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '16px' }}>
                                                        —
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'special' && (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 style={{ color: "#1a1a1a", fontWeight: 600, margin: 0 }}>
                                            Особые действия
                                        </h5>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-12">
                                            <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px", marginTop: "10px" }}>
                                                Удаление аккаунта
                                            </h6>
                                            <p style={{ color: "#666", marginBottom: "30px" }}>
                                                Это действие нельзя отменить. Все ваши данные будут удалены без возможности восстановления.
                                            </p>

                                            {!showDeleteConfirm ? (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    style={{
                                                        backgroundColor: '#D1001C',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '12px 30px',
                                                        borderRadius: '8px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    Удалить аккаунт
                                                </button>
                                            ) : (
                                                <div className="border p-4 rounded" style={{ backgroundColor: '#fff5f5' }}>
                                                    {deleteStep === 1 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Шаг 1: Подтвердите понимание последствий
                                                            </h6>
                                                            <div className="form-check mb-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="understandConsequences"
                                                                    checked={deleteConfirmations.understandConsequences}
                                                                    onChange={() => handleDeleteConfirmation('understandConsequences')}
                                                                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                                                />
                                                                <label className="form-check-label" htmlFor="understandConsequences" style={{ color: "#666", cursor: 'pointer', fontSize: '15px' }}>
                                                                    Я понимаю, что все мои данные будут удалены без возможности восстановления
                                                                </label>
                                                            </div>
                                                        </>
                                                    )}

                                                    {deleteStep === 2 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Шаг 2: Введите пароль
                                                            </h6>
                                                            <div className="mb-3">
                                                                <label className="form-label" style={{ color: "#666", fontWeight: 500, marginBottom: '10px' }}>
                                                                    Введите ваш пароль для подтверждения
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={deletePassword}
                                                                    onChange={(e) => setDeletePassword(e.target.value)}
                                                                    style={{
                                                                        border: "1px solid #e7eaf0",
                                                                        borderRadius: "8px",
                                                                        padding: "12px 15px",
                                                                        maxWidth: "300px"
                                                                    }}
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {deleteStep === 3 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Шаг 3: Последнее подтверждение
                                                            </h6>
                                                            <div style={{
                                                                backgroundColor: '#f8d7da',
                                                                border: '1px solid #f5c6cb',
                                                                color: '#721c24',
                                                                padding: '15px',
                                                                borderRadius: '6px',
                                                                marginBottom: '20px'
                                                            }}>
                                                                <strong>Внимание!</strong> Это последнее предупреждение. После нажатия кнопки "Удалить навсегда" все ваши данные будут удалены без возможности восстановления.
                                                            </div>
                                                            <div className="form-check mb-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="finalConfirm"
                                                                    checked={deleteConfirmations.finalConfirm}
                                                                    onChange={() => handleDeleteConfirmation('finalConfirm')}
                                                                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                                                />
                                                                <label className="form-check-label" htmlFor="finalConfirm" style={{ color: "#666", cursor: 'pointer', fontSize: '15px' }}>
                                                                    Я подтверждаю, что хочу удалить свой аккаунт навсегда
                                                                </label>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="d-flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowDeleteConfirm(false);
                                                                setDeleteStep(1);
                                                                setDeleteConfirmations({
                                                                    understandConsequences: false,
                                                                    enterPassword: false,
                                                                    typeDelete: false,
                                                                    finalConfirm: false
                                                                });
                                                                setDeletePassword('');
                                                            }}
                                                            style={{
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '12px 25px',
                                                                borderRadius: '8px',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                                fontSize: '15px'
                                                            }}
                                                        >
                                                            Отмена
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteAccount}
                                                            disabled={
                                                                (deleteStep === 1 && !deleteConfirmations.understandConsequences) ||
                                                                (deleteStep === 2 && !deletePassword) ||
                                                                (deleteStep === 3 && !deleteConfirmations.finalConfirm)
                                                            }
                                                            style={{
                                                                backgroundColor: deleteStep === 3 ? '#D1001C' : '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '12px 25px',
                                                                borderRadius: '8px',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                                fontSize: '15px',
                                                                opacity: (
                                                                    (deleteStep === 1 && !deleteConfirmations.understandConsequences) ||
                                                                    (deleteStep === 2 && !deletePassword) ||
                                                                    (deleteStep === 3 && !deleteConfirmations.finalConfirm)
                                                                ) ? 0.5 : 1
                                                            }}
                                                        >
                                                            {deleteStep === 3 ? 'Удалить навсегда' : 'Продолжить'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;