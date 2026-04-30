<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><out><xsl:apply-templates select="/root/*"/></out></xsl:template>
  <xsl:template match="*"><generic><xsl:value-of select="."/></generic></xsl:template>
  <xsl:template match="item"><item><xsl:value-of select="."/></item></xsl:template>
</xsl:stylesheet>