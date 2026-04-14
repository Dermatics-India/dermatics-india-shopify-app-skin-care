import React from 'react'
import { Page } from '@shopify/polaris'
import { useTranslation } from 'react-i18next'
import { Customization } from '../../components/customization'

const customize = () => {
  return (
    <Page fullWidth>
        <Customization type="customize" />
    </Page>
  )
}

export default customize