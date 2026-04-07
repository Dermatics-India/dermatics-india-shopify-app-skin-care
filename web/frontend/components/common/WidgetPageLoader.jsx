import React from 'react'
import { SkeletonPage, Layout, Card, Box, SkeletonBodyText } from '@shopify/polaris'
import { useTranslation } from 'react-i18next'

const WidgetPageLoader = () => {
  const { t } = useTranslation();
  return (
    <SkeletonPage title={t("cmn.loading")} primaryAction>
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <Box padding="400">
              <SkeletonBodyText lines={10} />
            </Box>
          </Card>
        </Layout.Section>
        <Layout.Section variant="twoThirds">
          <Card>
            <Box padding="400" minHeight="600px">
              <SkeletonBodyText lines={15} />
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  )
}

export { WidgetPageLoader }