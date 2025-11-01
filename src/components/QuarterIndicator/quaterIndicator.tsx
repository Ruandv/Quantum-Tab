import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuarterIndicatorProps } from '@/types/common';
import styles from './quaterIndicator.module.css';
import widgetCommon from '../../styles/widgetCommon.module.css';

const QuarterIndicator: React.FC<QuarterIndicatorProps> = ({
    startDate
}: QuarterIndicatorProps) => {
    const { t } = useTranslation();

    const [currentQuarterNumber, setCurrentQuarterNumber] = useState<number>(1);
    useEffect(() => {
        const start = new Date(startDate);
        const now = new Date();
        const diffInMonths =
            (now.getFullYear() - start.getFullYear()) * 12 +
            (now.getMonth() - start.getMonth());
        const quarterNumber = Math.floor(diffInMonths / 3) + 1;
        setCurrentQuarterNumber(quarterNumber > 0 ? quarterNumber : 1);

    }, [startDate]);
    return (
        <>
            <div className={`${widgetCommon.widgetTitle}`}>
                {t('quarterIndicator.labels.quarter')}
            </div>
            <div className={`${styles.quarterNumber}`}>
                {currentQuarterNumber}
            </div>
        </>
    );
};

export default QuarterIndicator;
