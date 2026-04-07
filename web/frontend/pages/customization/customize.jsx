import React from 'react'
import { Page } from '@shopify/polaris'
import { useTranslation } from 'react-i18next'
import { CustomizeWidget } from '../../components/customization';

const customize = () => {
  return (
    <Page fullWidth>
        <CustomizeWidget type="customize" />
    </Page>
  )
}

export default customize