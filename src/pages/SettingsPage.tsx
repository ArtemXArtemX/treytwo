import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import authService from '../api/authService';
import userService, { UserZone } from '../api/userService';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'anthropometry' | 'special'>('general');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [deleteStep, setDeleteStep] = useState<number>(1);
    const [deletePassword, setDeletePassword] = useState<string>('');
    const [deleteError, setDeleteError] = useState<string>('');
    const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

    const [user, setUser] = useState<any>(null);
    const [userZones, setUserZones] = useState<UserZone[]>([]);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState({
        general: false,
        anthropometry: false,
    });

    const [anthropometryForm, setAnthropometryForm] = useState({
        user_height: 0,
        user_weight: 0,
        user_hr_rest: 0,
        user_hr_max: 0,
        user_pace_max: null as number | null
    });

    const [generalForm, setGeneralForm] = useState({
        user_nickname: '',
        user_email: '',
        user_surname: '',
        user_name: '',
        user_fathername: '',
        user_birthday: '',
        user_gender: false
    });

    const [securityForm, setSecurityForm] = useState({
        last_password: '',
        new_password: '',
        confirm_password: ''
    });



    useEffect(() => {
        const loadUserData = async () => {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                navigate('/login');
                return;
            }
            setUser(currentUser);
            setAnthropometryForm({
                user_height: currentUser.user_height || 0,
                user_weight: currentUser.user_weight || 0,
                user_hr_rest: currentUser.user_hr_rest || 0,
                user_hr_max: currentUser.user_hr_max || 0,
                user_pace_max: currentUser.user_pace_max
            });
            setGeneralForm({
                user_nickname: currentUser.user_nickname,
                user_email: currentUser.user_email,
                user_surname: currentUser.user_surname || '',
                user_name: currentUser.user_name || '',
                user_fathername: currentUser.user_fathername || '',
                user_birthday: currentUser.user_birthday || '',
                user_gender: currentUser.user_gender || false
            });

            try {
                const zones = await userService.getUserZones(currentUser.id);
                setUserZones(zones);
            } catch (error) {
                console.error('Ошибка загрузки зон:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, [navigate]);

    const handleUpdateAnthropometry = async () => {
        if (!user) return;

        try {
            const updatedUser = await userService.updateUser(user.id, {
                user_surname: user.user_surname,
                user_name: user.user_name,
                user_fathername: user.user_fathername,
                user_email: user.user_email,
                user_nickname: user.user_nickname,
                user_birthday: user.user_birthday,
                user_gender: user.user_gender,
                user_height: anthropometryForm.user_height,
                user_weight: anthropometryForm.user_weight,
                user_only_coach: user.user_only_coach,
                user_hr_rest: anthropometryForm.user_hr_rest,
                user_hr_max: anthropometryForm.user_hr_max,
                user_pace_max: anthropometryForm.user_pace_max,
                password: "12345678"
            });

            setUser(updatedUser);
            setEditMode({ ...editMode, anthropometry: false });
            alert('Данные успешно обновлены');
        } catch (error: any) {
            console.error("Ошибка ответа:", error.response?.data);
            alert('Ошибка при обновлении данных');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteStep === 1) {
            setDeleteStep(2);
        } else if (deleteStep === 2) {
            try {
                if (!user) return;
                await userService.changePassword(user.id, deletePassword, deletePassword + '_temp');
                setDeleteStep(3);
                setDeleteError('');
            } catch (error) {
                setDeleteError('Неверный пароль');
            }
        } else if (deleteStep === 3 && deleteConfirmText === 'УДАЛИТЬ') {
            try {
                if (!user) return;
                await userService.deleteUser(user.id);
                authService.logout();
            } catch (error) {
                setDeleteError('Ошибка при удалении аккаунта');
            }
        }
    };

    const handleUpdateGeneral = async () => {
        if (!user) return;
        try {
            let currentUser = { ...user };

            if (generalForm.user_nickname !== user.user_nickname) {
                const nicknameUpdated = await userService.changeNickname(user.id, generalForm.user_nickname);
                currentUser = { ...currentUser, ...nicknameUpdated };
            }

            if (generalForm.user_email !== user.user_email) {
                const emailUpdated = await userService.changeEmail(user.id, generalForm.user_email);
                currentUser = { ...currentUser, ...emailUpdated };
            }

            if (generalForm.user_surname !== user.user_surname ||
                generalForm.user_name !== user.user_name ||
                generalForm.user_fathername !== user.user_fathername ||
                generalForm.user_birthday !== user.user_birthday ||
                generalForm.user_gender !== user.user_gender) {

                const updatedData = await userService.updateUser(user.id, {
                    user_surname: generalForm.user_surname,
                    user_name: generalForm.user_name,
                    user_fathername: generalForm.user_fathername,
                    user_email: currentUser.user_email,
                    user_nickname: currentUser.user_nickname,
                    user_birthday: generalForm.user_birthday,
                    user_gender: generalForm.user_gender,
                    user_height: user.user_height,
                    user_weight: user.user_weight,
                    user_only_coach: user.user_only_coach,
                    user_hr_rest: user.user_hr_rest,
                    user_hr_max: user.user_hr_max,
                    user_pace_max: user.user_pace_max,
                    password: "dummy_password"
                });
                currentUser = { ...currentUser, ...updatedData };
            }

            setUser(currentUser);
            setEditMode({ ...editMode, general: false });
            alert('Данные успешно обновлены');
        } catch (error) {
            alert('Ошибка при обновлении данных');
        }
    };

    const handleChangePassword = async () => {
        if (securityForm.new_password !== securityForm.confirm_password) {
            alert('Пароли не совпадают');
            return;
        }
        if (!user) return;
        try {
            await userService.changePassword(user.id, securityForm.last_password, securityForm.new_password);
            setSecurityForm({ last_password: '', new_password: '', confirm_password: '' });
            alert('Пароль успешно изменен');
        } catch (error) {
            alert('Ошибка при смене пароля');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Не указано";
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getGenderText = (gender: boolean) => {
        return gender ? "Мужской" : "Женский";
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
                <Header />
                <div className="container py-4 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

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
                                            onClick={() => setEditMode({ ...editMode, general: !editMode.general })}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                fontWeight: 500,
                                                backgroundColor: editMode.general ? "#D1001C" : "#f8f9fa",
                                                color: editMode.general ? "white" : "#6c757d",
                                                border: editMode.general ? "none" : "1px solid #6c757d",
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: "none"
                                            }}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            {editMode.general ? "Отмена" : "Редактировать"}
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Фамилия
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={generalForm.user_surname}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_surname: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_surname || "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Имя
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={generalForm.user_name}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_name: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_name || "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Отчество
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={generalForm.user_fathername}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_fathername: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_fathername || "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Логин
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={generalForm.user_nickname}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_nickname: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_nickname}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пол
                                            </label>
                                            {editMode.general ? (
                                                <select
                                                    className="form-select"
                                                    value={generalForm.user_gender ? "male" : "female"}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_gender: e.target.value === "male" })}
                                                >
                                                    <option value="male">Мужской</option>
                                                    <option value="female">Женский</option>
                                                </select>
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {getGenderText(user?.user_gender || false)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Дата рождения
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={generalForm.user_birthday}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_birthday: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {formatDate(user?.user_birthday || "")}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Email
                                            </label>
                                            {editMode.general ? (
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={generalForm.user_email}
                                                    onChange={(e) => setGeneralForm({ ...generalForm, user_email: e.target.value })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {editMode.general && (
                                        <div className="mt-3">
                                            <button
                                                onClick={handleUpdateGeneral}
                                                style={{
                                                    backgroundColor: "#28a745",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "10px 30px",
                                                    borderRadius: "8px",
                                                    fontWeight: 500,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Сохранить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                        Безопасность
                                    </h5>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Текущий пароль
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={securityForm.last_password}
                                                onChange={(e) => setSecurityForm({ ...securityForm, last_password: e.target.value })}
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
                                                value={securityForm.new_password}
                                                onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Подтверждение пароля
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={securityForm.confirm_password}
                                                onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-md-12 mt-2">
                                            <button
                                                onClick={handleChangePassword}
                                                style={{
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    fontWeight: 500,
                                                    padding: '10px 30px',
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    cursor: "pointer"
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
                                            onClick={() => setEditMode({ ...editMode, anthropometry: !editMode.anthropometry })}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                fontWeight: 500,
                                                backgroundColor: editMode.anthropometry ? "#D1001C" : "#f8f9fa",
                                                color: editMode.anthropometry ? "white" : "#6c757d",
                                                border: editMode.anthropometry ? "none" : "1px solid #6c757d",
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: "none"
                                            }}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            {editMode.anthropometry ? "Отмена" : "Редактировать"}
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Рост
                                            </label>
                                            {editMode.anthropometry ? (
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={anthropometryForm.user_height ? (anthropometryForm.user_height * 100).toFixed(0) : ''}
                                                    onChange={(e) => setAnthropometryForm({ ...anthropometryForm, user_height: Number(e.target.value) / 100 })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_height ? `${(user.user_height * 100).toFixed(0)} см` : "Не указано"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Вес
                                            </label>
                                            {editMode.anthropometry ? (
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={anthropometryForm.user_weight}
                                                    onChange={(e) => setAnthropometryForm({ ...anthropometryForm, user_weight: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_weight ? `${user.user_weight} кг` : "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пульс покоя
                                            </label>
                                            {editMode.anthropometry ? (
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={anthropometryForm.user_hr_rest}
                                                    onChange={(e) => setAnthropometryForm({ ...anthropometryForm, user_hr_rest: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_hr_rest ? `${user.user_hr_rest} уд/мин` : "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Максимальный пульс
                                            </label>
                                            {editMode.anthropometry ? (
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={anthropometryForm.user_hr_max}
                                                    onChange={(e) => setAnthropometryForm({ ...anthropometryForm, user_hr_max: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_hr_max ? `${user.user_hr_max} уд/мин` : "Не указано"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Макс. темп
                                            </label>
                                            {editMode.anthropometry ? (
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    className="form-control"
                                                    value={anthropometryForm.user_pace_max || ''}
                                                    onChange={(e) => setAnthropometryForm({ ...anthropometryForm, user_pace_max: e.target.value ? Number(e.target.value) : null })}
                                                />
                                            ) : (
                                                <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                    {user?.user_pace_max ? `${user.user_pace_max} мин/км` : "Не указано"}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {editMode.anthropometry && (
                                        <div className="mt-3">
                                            <button
                                                onClick={handleUpdateAnthropometry}
                                                style={{
                                                    backgroundColor: "#28a745",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "10px 30px",
                                                    borderRadius: "8px",
                                                    fontWeight: 500,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Сохранить
                                            </button>
                                        </div>
                                    )}

                                    <div className="mt-5 pt-4 border-top">
                                        <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                            Пределы зон ЧСС
                                        </h6>
                                        <div className="table-responsive">
                                            <table className="table" style={{ border: "1px solid #e7eaf0", borderRadius: "8px", tableLayout: "fixed" }}>
                                                <thead style={{ backgroundColor: "#f8f9fa" }}>
                                                <tr>
                                                    <th style={{ color: "#666", fontWeight: 500, padding: "12px 15px", border: "none", width: "20%" }}>Зона</th>
                                                    <th style={{ color: "#666", fontWeight: 500, padding: "12px 15px", border: "none", width: "40%" }}>Пределы</th>
                                                    <th style={{ color: "#666", fontWeight: 500, padding: "12px 15px", border: "none", width: "40%" }}>% максимум</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {userZones.length > 0 ? (
                                                    userZones.map((zone) => {
                                                        const maxHr = user?.user_hr_max || 0;
                                                        const lowPercent = maxHr ? Math.round((zone.low_limit / maxHr) * 100) : 0;
                                                        const highPercent = maxHr ? Math.round((zone.high_limit / maxHr) * 100) : 0;

                                                        return (
                                                            <tr key={zone.id} style={{ borderTop: "1px solid #e7eaf0" }}>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                    {zone.zone_number}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {zone.low_limit} - {zone.high_limit} уд/мин
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lowPercent} - {highPercent} %
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="text-center text-muted py-3">
                                                            Нет данных о пульсовых зонах
                                                        </td>
                                                    </tr>
                                                )}
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
                                                        {user?.user_height && user?.user_weight
                                                            ? (user.user_weight / ((user.user_height) * (user.user_height))).toFixed(1)
                                                            : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <span style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '5px' }}>Резерв пульса:</span>
                                                    <div style={{ color: '#1a1a1a', fontWeight: 500, fontSize: '16px' }}>
                                                        {user?.user_hr_max && user?.user_hr_rest
                                                            ? `${user.user_hr_max - user.user_hr_rest} уд/мин`
                                                            : '—'}
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
                                                    {deleteError && (
                                                        <div className="alert alert-danger mb-3" style={{ fontSize: "0.875rem", padding: "8px 12px" }}>
                                                            {deleteError}
                                                        </div>
                                                    )}

                                                    {deleteStep === 1 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Вы уверены, что хотите удалить аккаунт?
                                                            </h6>
                                                            <p style={{ color: "#666", marginBottom: "20px" }}>
                                                                Все ваши тренировки, статистика и личные данные будут безвозвратно удалены.
                                                            </p>
                                                        </>
                                                    )}

                                                    {deleteStep === 2 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Подтвердите пароль
                                                            </h6>
                                                            <div className="mb-3">
                                                                <label className="form-label" style={{ color: "#666", fontWeight: 500, marginBottom: '10px' }}>
                                                                    Введите ваш пароль для подтверждения
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={deletePassword}
                                                                    onChange={(e) => {
                                                                        setDeletePassword(e.target.value);
                                                                        setDeleteError('');
                                                                    }}
                                                                    style={{
                                                                        border: "1px solid #e7eaf0",
                                                                        borderRadius: "8px",
                                                                        padding: "12px 15px",
                                                                        maxWidth: "300px"
                                                                    }}
                                                                    placeholder="Ваш пароль"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {deleteStep === 3 && (
                                                        <>
                                                            <h6 style={{ color: "#dc3545", fontWeight: 600, marginBottom: "15px" }}>
                                                                Последнее подтверждение
                                                            </h6>
                                                            <div style={{
                                                                backgroundColor: '#f8d7da',
                                                                border: '1px solid #f5c6cb',
                                                                color: '#721c24',
                                                                padding: '15px',
                                                                borderRadius: '6px',
                                                                marginBottom: '20px'
                                                            }}>
                                                                <strong>Внимание!</strong> Это последний шаг. После удаления восстановить данные будет невозможно.
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="form-label" style={{ color: "#666", fontWeight: 500, marginBottom: '10px' }}>
                                                                    Введите слово <strong>УДАЛИТЬ</strong> для подтверждения
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={deleteConfirmText}
                                                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                                    style={{
                                                                        border: "1px solid #e7eaf0",
                                                                        borderRadius: "8px",
                                                                        padding: "12px 15px",
                                                                        maxWidth: "300px"
                                                                    }}
                                                                    placeholder="УДАЛИТЬ"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="d-flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowDeleteConfirm(false);
                                                                setDeleteStep(1);
                                                                setDeletePassword('');
                                                                setDeleteConfirmText('');
                                                                setDeleteError('');
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
                                                                (deleteStep === 2 && !deletePassword) ||
                                                                (deleteStep === 3 && deleteConfirmText !== 'УДАЛИТЬ')
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
                                                                    (deleteStep === 2 && !deletePassword) ||
                                                                    (deleteStep === 3 && deleteConfirmText !== 'УДАЛИТЬ')
                                                                ) ? 0.5 : 1
                                                            }}
                                                        >
                                                            {deleteStep === 1 && 'Продолжить'}
                                                            {deleteStep === 2 && 'Подтвердить пароль'}
                                                            {deleteStep === 3 && 'Удалить навсегда'}
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