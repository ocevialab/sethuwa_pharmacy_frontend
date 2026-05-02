import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import CustomersViewHeader from '@/components/customersView/CustomersViewHeader'
import CustomerContent from '@/components/customersView/CustomerContent'
import Footer from '@/components/shared/Footer'

const CustomersView = () => {
    return (
        <>
            <PageHeader>
                <CustomersViewHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <CustomerContent/>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default CustomersView