import React from 'react'
import MedicineTable from '@/components/medicine/MedicineTable'
import MedicineHeader from '@/components/medicine/MedicineHeader'
import MedicineSummaryCards from '@/components/medicine/MedicineSummaryCards'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const MedicineList = () => {
    return (
        <>
            <PageHeader>
                <MedicineHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className='col-12'>
                        <MedicineSummaryCards />
                        <MedicineTable />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default MedicineList;

