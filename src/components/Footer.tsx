import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Footer: React.FC = () => {
    return (
        <footer className="bg-dark text-light py-4">
            <div className="container">

                <div className="row mb-3">

                    <div className="col-md-4 text-center mb-3 mb-md-0">
                        <div className="mb-1 small text-muted">Пользовательское соглашение</div>
                        <a
                            href="/terms"
                            className="text-decoration-none text-light fw-medium"
                            title="Условия пользовательского соглашения"
                        >
                            Условия использования
                        </a>
                    </div>

                    <div className="col-md-4 text-center mb-3 mb-md-0">
                        <div className="mb-1 small text-muted">Конфиденциальность данных</div>
                        <a
                            href="/privacy"
                            className="text-decoration-none text-light fw-medium"
                            title="Уведомление о конфиденциальности"
                        >
                            Политика конфиденциальности
                        </a>
                    </div>

                    <div className="col-md-4 text-center">
                        <div className="mb-1 small text-muted">Поддержка пользователей</div>
                        <a
                            href="/support"
                            className="text-decoration-none text-light fw-medium"
                            title="Служба обратной связи"
                        >
                            Обратная связь
                        </a>
                    </div>

                </div>

                <div className="text-center pt-3 border-top border-secondary">
                    <div className="d-inline-flex align-items-center">
                        <span className="fs-5 fw-bold">
                            © Trey<sup>2</sup> 2026
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
};
export default Footer;