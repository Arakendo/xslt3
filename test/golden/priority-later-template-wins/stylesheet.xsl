<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><out><xsl:apply-templates select="/root/item"/></out></xsl:template>
  <xsl:template match="item"><first><xsl:value-of select="."/></first></xsl:template>
  <xsl:template match="item"><second><xsl:value-of select="."/></second></xsl:template>
</xsl:stylesheet>