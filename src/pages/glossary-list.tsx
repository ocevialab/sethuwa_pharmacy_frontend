import React from 'react'
import GlossaryTable from '@/components/glossary/GlossaryTable'
import GlossaryHeader from '@/components/glossary/GlossaryHeader'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const GlossaryList = () => {
    return (
        <>
            <PageHeader>
                <GlossaryHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <GlossaryTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default GlossaryList;

