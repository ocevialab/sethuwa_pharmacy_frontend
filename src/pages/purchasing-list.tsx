import React from 'react'
import PurchasingTable from '@/components/purchasing/PurchasingTable'
import PurchasingHeader from '@/components/purchasing/PurchasingHeader'
import PurchasingSummaryCards from '@/components/purchasing/PurchasingSummaryCards'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const PurchasingList = () => {
    return (
        <>
            <PageHeader>
                <PurchasingHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className='col-12'>
                        <PurchasingSummaryCards />
                        <PurchasingTable />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default PurchasingList;

