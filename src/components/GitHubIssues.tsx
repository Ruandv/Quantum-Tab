import React from 'react';

const GitHubIssues: React.FC = () => {
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
                        <h2><a href='https://github.com/Ruandv/Quantum-Tab/issues/new?template=bug_report.yml'>🧙‍♂️ Request a feature</a></h2>
                        <h2><a href='https://github.com/Ruandv/Quantum-Tab/issues/new?template=feature_request.yml'>🐛 Log a bug</a></h2>
                    </section >

                )}
        </>
    );
};

export default GitHubIssues;