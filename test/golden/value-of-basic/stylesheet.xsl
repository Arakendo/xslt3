<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><hello><xsl:value-of select="/root/name"/></hello></xsl:template>
</xsl:stylesheet>