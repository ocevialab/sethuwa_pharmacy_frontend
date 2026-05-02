import React from 'react'
import SupplierTable from '@/components/supplier/SupplierTable'
import SupplierHeader from '@/components/supplier/SupplierHeader'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const SupplierList = () => {
    return (
        <>
            <PageHeader>
                <SupplierHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <SupplierTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SupplierList;

