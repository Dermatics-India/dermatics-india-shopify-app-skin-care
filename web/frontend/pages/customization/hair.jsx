import React, { useEffect } from 'react'
import { Page } from '@shopify/polaris'
import { useTranslation } from 'react-i18next'
import { CustomizeWidget } from '../../components/customization';

const hair = () => {
    const { t } = useTranslation();
    
    return (
        <Page fullWidth>
            <CustomizeWidget type="haircare" />
        </Page>
    )
}

export default hair