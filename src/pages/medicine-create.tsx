import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import MedicineCreateHeader from '@/components/medicineCreate/MedicineCreateHeader'
import MedicineForm from '@/components/medicine/MedicineForm'
import Footer from '@/components/shared/Footer'

const MedicineCreate = () => {
    return (
        <>
            <PageHeader>
                <MedicineCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <MedicineForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default MedicineCreate;

