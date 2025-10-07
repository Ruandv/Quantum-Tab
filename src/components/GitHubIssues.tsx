import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    GitHubIssuesProps
} from '@/types/common';

const GitHubIssues: React.FC<GitHubIssuesProps> = (props) => {
    const { t } = useTranslation();
    const [showModal, setShowModal] = React.useState(false);
    return (
        <>
            {!props.isLocked && (
                <div
                    className="github-issues"
                    onClick={() => setShowModal((prev) => !prev)}
                >
                </div>
            )}
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