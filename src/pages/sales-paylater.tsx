import React from 'react'
import PayLaterTable from '@/components/sales/PayLaterTable'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const SalesPayLater = () => {
    return (
        <>
            <PageHeader>
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <h5 className="mb-0">Pay-Later List</h5>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PayLaterTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SalesPayLater;

