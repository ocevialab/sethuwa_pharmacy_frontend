import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import SalesCreateHeader from '@/components/salesCreate/SalesCreateHeader'
import SalesForm from '@/components/sales/SalesForm'
import Footer from '@/components/shared/Footer'

const SalesCreate = () => {
    return (
        <>
            <PageHeader>
                <SalesCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <SalesForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SalesCreate;

