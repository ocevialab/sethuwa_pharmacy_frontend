import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import CustomersCreateHeader from '@/components/customersCreate/CustomersCreateHeader'
import CustomerForm from '@/components/customers/CustomerForm'
import Footer from '@/components/shared/Footer'

const CustomersCreate = () => {
    return (
        <>
            <PageHeader>
                <CustomersCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <CustomerForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default CustomersCreate