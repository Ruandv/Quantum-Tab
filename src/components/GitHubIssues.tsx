import React from 'react';
import { useTranslation } from 'react-i18next';

const GitHubIssues: React.FC = () => {
    const { t } = useTranslation();
    const [showModal, setShowModal] = React.useState(false);
    return (
        <>
            <div
                className="github-issues"
                onClick={() => setShowModal((prev) => !prev)}
            >
            </div>
            {showModal && (

                    <section className="github-issues-modal">
                        <h2><a href='https://github.com/Ruandv/Quantum-Tab/issues/new?template=feature_request.yml'>{t('githubIssues.links.requestFeature')}</a></h2>
                        <h2><a href='https://github.com/Ruandv/Quantum-Tab/issues/new?template=bug_report.yml'>{t('githubIssues.links.logBug')}</a></h2>
                    </section >

                )}
        </>
    );
};

export default GitHubIssues;