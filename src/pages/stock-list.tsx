import React from 'react';
import StockTable from '@/components/stock/StockTable';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';

const StockList = () => {
    return (
        <>
            <PageHeader>
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <h5 className="mb-0">Stock Management</h5>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <StockTable />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default StockList;

