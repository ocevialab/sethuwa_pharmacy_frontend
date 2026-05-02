import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import SupplierCreateHeader from '@/components/supplierCreate/SupplierCreateHeader'
import SupplierForm from '@/components/supplier/SupplierForm'
import Footer from '@/components/shared/Footer'

const SupplierCreate = () => {
    return (
        <>
            <PageHeader>
                <SupplierCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <SupplierForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SupplierCreate;

