import React from 'react'
import InventoryTable from '@/components/inventory/InventoryTable'
import InventoryHeader from '@/components/inventory/InventoryHeader'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const InventoryList = () => {
    return (
        <>
            <PageHeader>
                <InventoryHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <InventoryTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default InventoryList;

