<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><items><xsl:apply-templates/></items></xsl:template>
  <xsl:template match="item"><item><xsl:value-of select="."/></item></xsl:template>
</xsl:stylesheet>