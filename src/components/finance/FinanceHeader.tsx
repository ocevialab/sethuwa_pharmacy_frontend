import React from 'react'
import { FiRefreshCw, FiFileText, FiDownload } from 'react-icons/fi'
import { BsFiletypeCsv, BsFiletypeExe, BsFiletypePdf } from 'react-icons/bs';
import Dropdown from '@/components/shared/Dropdown';

interface FinanceHeaderProps {
    onRefresh?: () => void;
    onGenerateReport?: () => void;
    onDownloadPDF?: () => void;
    onDownloadCSV?: () => void;
    onDownloadExcel?: () => void;
}

const FinanceHeader: React.FC<FinanceHeaderProps> = ({ 
    onRefresh, 
    onGenerateReport,
    onDownloadPDF,
    onDownloadCSV,
    onDownloadExcel
}) => {
    const downloadOptions = [
        {
            label: "Download as PDF",
            icon: <BsFiletypePdf />,
            onClick: onDownloadPDF,
        },
        {
            label: "Download as CSV",
            icon: <BsFiletypeCsv />,
            onClick: onDownloadCSV,
        },
        {
            label: "Download as Excel",
            icon: <BsFiletypeExe />,
            onClick: onDownloadExcel,
        },
    ].filter(item => item.onClick !== undefined);

    return (
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            {downloadOptions.length > 0 && (
                <Dropdown
                    dropdownItems={downloadOptions as any}
                    triggerPosition={"0, 12"}
                    triggerClass="btn btn-success"
                    triggerIcon={<FiDownload size={16} />}
                    triggerText="Download Reports"
                    isAvatar={false}
                    dropdownAutoClose={true}
                    dropdownParentStyle=""
                    tooltipTitle=""
                    dropdownMenuStyle=""
                    iconStrokeWidth={1.7}
                    isItemIcon={true}
                    onClick={() => {}}
                    active=""
                    id=""
                />
            )}
            {onGenerateReport && (
                <button className="btn btn-success" onClick={onGenerateReport}>
                    <FiFileText size={16} className='me-2' />
                    <span>Generate Report</span>
                </button>
            )}
            {onRefresh && (
                <button className="btn btn-primary" onClick={onRefresh}>
                    <FiRefreshCw size={16} className='me-2' />
                    <span>Refresh</span>
                </button>
            )}
        </div>
    )
}

export default FinanceHeader

