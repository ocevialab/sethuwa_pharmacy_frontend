import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import PurchasingCreateHeader from '@/components/purchasingCreate/PurchasingCreateHeader'
import PurchasingForm from '@/components/purchasing/PurchasingForm'
import Footer from '@/components/shared/Footer'

const PurchasingCreate = () => {
    return (
        <>
            <PageHeader>
                <PurchasingCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PurchasingForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default PurchasingCreate;

