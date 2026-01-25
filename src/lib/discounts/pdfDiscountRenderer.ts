/**
 * Sommer's Proposal System - PDF Discount Integration
 * Functions to render discounts in PDF proposals
 */

import { jsPDF } from 'jspdf';
import type { AppliedDiscount } from './discountTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalPDFData {
  // Proposal info
  proposalNumber: string;
  proposalName: string;
  createdDate: string;
  validUntil: string;
  
  // Client info
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Company info
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  
  // Services
  services: {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  
  // Pricing
  subtotal: number;
  tier: 'economy' | 'standard' | 'premium';
  tierMultiplier: number;
  
  // Discounts
  appliedDiscounts: AppliedDiscount[];
  totalDiscount: number;
  discountedSubtotal: number;
  
  // Tax & Total
  taxRate?: number;
  taxAmount?: number;
  total: number;
  
  // Payment terms
  depositRequired?: boolean;
  depositPercent?: number;
  depositAmount?: number;
  balanceDue?: number;
  paymentTerms?: string;
  
  // Branding
  brandColor: string;
  accentColor?: string;
}

export interface PDFDiscountOptions {
  showDiscountDetails: boolean;
  showSavingsHighlight: boolean;
  showPromoCode: boolean;
  showLoyaltyInfo: boolean;
  discountBadgeStyle: 'minimal' | 'prominent' | 'banner';
}

// ============================================================================
// PDF DISCOUNT RENDERER
// ============================================================================

export class PDFDiscountRenderer {
  private doc: jsPDF;
  private brandColor: string;
  private currentY: number;
  private pageWidth: number;
  private margin: number;
  private contentWidth: number;

  constructor(doc: jsPDF, brandColor: string = '#C41E3A') {
    this.doc = doc;
    this.brandColor = brandColor;
    this.currentY = 0;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.margin = 20;
    this.contentWidth = this.pageWidth - this.margin * 2;
  }

  /**
   * Render the discount section in the PDF
   */
  renderDiscountSection(
    startY: number,
    discounts: AppliedDiscount[],
    subtotal: number,
    options: PDFDiscountOptions = {
      showDiscountDetails: true,
      showSavingsHighlight: true,
      showPromoCode: true,
      showLoyaltyInfo: true,
      discountBadgeStyle: 'prominent',
    }
  ): number {
    this.currentY = startY;

    if (discounts.length === 0) {
      return this.currentY;
    }

    const totalDiscount = discounts.reduce((sum, d) => sum + d.discountAmount, 0);
    const savingsPercent = ((totalDiscount / subtotal) * 100).toFixed(1);

    // Savings highlight banner
    if (options.showSavingsHighlight) {
      this.renderSavingsBanner(totalDiscount, savingsPercent, options.discountBadgeStyle);
    }

    // Individual discounts
    if (options.showDiscountDetails) {
      this.renderDiscountList(discounts, options);
    }

    return this.currentY;
  }

  /**
   * Render savings banner
   */
  private renderSavingsBanner(
    totalDiscount: number,
    savingsPercent: string,
    style: 'minimal' | 'prominent' | 'banner'
  ): void {
    const doc = this.doc;

    if (style === 'banner') {
      // Full-width banner
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(this.margin, this.currentY, this.contentWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🎉 YOU SAVE', this.margin + 10, this.currentY + 10);

      doc.setFontSize(18);
      doc.text(`$${totalDiscount.toFixed(2)}`, this.margin + 10, this.currentY + 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`(${savingsPercent}% off)`, this.margin + 80, this.currentY + 20);

      this.currentY += 30;
    } else if (style === 'prominent') {
      // Boxed highlight
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(this.margin, this.currentY, this.contentWidth, 20, 3, 3, 'FD');

      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `✓ Total Savings: $${totalDiscount.toFixed(2)} (${savingsPercent}% off)`,
        this.margin + 10,
        this.currentY + 13
      );

      this.currentY += 25;
    } else {
      // Minimal inline
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Savings: $${totalDiscount.toFixed(2)} (${savingsPercent}%)`,
        this.margin,
        this.currentY + 5
      );
      this.currentY += 10;
    }

    doc.setTextColor(0, 0, 0); // Reset
  }

  /**
   * Render individual discount items
   */
  private renderDiscountList(discounts: AppliedDiscount[], options: PDFDiscountOptions): void {
    const doc = this.doc;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Applied Discounts:', this.margin, this.currentY + 5);
    this.currentY += 10;

    discounts.forEach((discount) => {
      // Discount icon based on type
      const icon = this.getDiscountIcon(discount.sourceType);
      
      // Discount name
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${icon} ${discount.sourceName}`, this.margin + 5, this.currentY + 5);

      // Promo code if applicable
      if (options.showPromoCode && discount.sourceType === 'promo_code') {
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Code: ${discount.sourceName}`, this.margin + 100, this.currentY + 5);
      }

      // Discount amount
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(
        `-$${discount.discountAmount.toFixed(2)}`,
        this.pageWidth - this.margin - 30,
        this.currentY + 5,
        { align: 'right' }
      );

      // Discount value description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const valueText =
        discount.discountType === 'percent'
          ? `${discount.discountValue}% off`
          : `$${discount.discountValue} off`;
      doc.text(valueText, this.margin + 5, this.currentY + 10);

      this.currentY += 15;
    });

    doc.setTextColor(0, 0, 0); // Reset
  }

  /**
   * Get icon for discount type
   */
  private getDiscountIcon(type: string): string {
    const icons: Record<string, string> = {
      promo_code: '🏷️',
      loyalty: '👑',
      volume: '📦',
      seasonal: '🌟',
      automatic_rule: '⚡',
      manual: '✏️',
      referral: '🎁',
    };
    return icons[type] || '💰';
  }

  /**
   * Render pricing summary with discounts
   */
  renderPricingSummary(
    startY: number,
    data: {
      subtotal: number;
      discounts: AppliedDiscount[];
      totalDiscount: number;
      discountedSubtotal: number;
      taxRate?: number;
      taxAmount?: number;
      total: number;
      depositAmount?: number;
      balanceDue?: number;
    }
  ): number {
    this.currentY = startY;
    const doc = this.doc;
    const rightCol = this.pageWidth - this.margin;
    const labelX = rightCol - 100;
    const valueX = rightCol;

    // Background box
    doc.setFillColor(249, 250, 251);
    doc.rect(this.margin, this.currentY, this.contentWidth, data.discounts.length > 0 ? 90 : 60, 'F');

    this.currentY += 10;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', labelX, this.currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.text(`$${data.subtotal.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
    this.currentY += 8;

    // Discounts
    if (data.discounts.length > 0) {
      data.discounts.forEach((discount) => {
        doc.setTextColor(22, 101, 52);
        doc.text(`${discount.sourceName}:`, labelX, this.currentY, { align: 'right' });
        doc.text(`-$${discount.discountAmount.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
        this.currentY += 7;
      });

      // Discounted subtotal
      doc.setTextColor(100, 100, 100);
      doc.text('After Discounts:', labelX, this.currentY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      doc.text(`$${data.discountedSubtotal.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
      this.currentY += 8;
    }

    // Tax
    if (data.taxRate && data.taxAmount) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${data.taxRate}%):`, labelX, this.currentY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      doc.text(`$${data.taxAmount.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
      this.currentY += 8;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(labelX - 50, this.currentY, valueX, this.currentY);
    this.currentY += 8;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const hexColor = this.brandColor.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    doc.setTextColor(r, g, b);
    doc.text('TOTAL:', labelX, this.currentY, { align: 'right' });
    doc.text(`$${data.total.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
    this.currentY += 10;

    // Savings callout
    if (data.totalDiscount > 0) {
      doc.setFontSize(10);
      doc.setTextColor(22, 101, 52);
      doc.text(
        `You save $${data.totalDiscount.toFixed(2)}!`,
        (labelX + valueX) / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 8;
    }

    // Deposit info
    if (data.depositAmount && data.balanceDue) {
      this.currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Deposit Due: $${data.depositAmount.toFixed(2)}`, labelX, this.currentY, { align: 'right' });
      doc.text(`Balance Due: $${data.balanceDue.toFixed(2)}`, valueX, this.currentY, { align: 'right' });
    }

    doc.setTextColor(0, 0, 0); // Reset
    return this.currentY + 10;
  }

  /**
   * Render loyalty status in PDF
   */
  renderLoyaltyStatus(
    startY: number,
    loyaltyData: {
      tierName: string;
      currentPoints: number;
      tierDiscount: number;
      pointsEarned?: number;
    }
  ): number {
    this.currentY = startY;
    const doc = this.doc;

    // Loyalty badge box
    doc.setFillColor(254, 243, 199); // Yellow background
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(this.margin, this.currentY, this.contentWidth, 30, 3, 3, 'FD');

    // Crown icon
    doc.setFontSize(16);
    doc.text('👑', this.margin + 10, this.currentY + 18);

    // Tier info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(146, 64, 14);
    doc.text(`${loyaltyData.tierName} Member`, this.margin + 30, this.currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `${loyaltyData.currentPoints.toLocaleString()} points • ${loyaltyData.tierDiscount}% member discount applied`,
      this.margin + 30,
      this.currentY + 22
    );

    // Points earned this order
    if (loyaltyData.pointsEarned) {
      doc.setTextColor(22, 101, 52);
      doc.text(
        `+${loyaltyData.pointsEarned} points earned with this order!`,
        this.pageWidth - this.margin - 10,
        this.currentY + 18,
        { align: 'right' }
      );
    }

    doc.setTextColor(0, 0, 0);
    return this.currentY + 35;
  }

  /**
   * Render promo code callout box
   */
  renderPromoCodeCallout(startY: number, code: string, discountValue: string): number {
    this.currentY = startY;
    const doc = this.doc;

    // Dashed border box
    doc.setDrawColor(156, 163, 175);
    doc.setLineDashPattern([3, 3], 0);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(this.margin, this.currentY, this.contentWidth, 25, 3, 3, 'FD');
    doc.setLineDashPattern([], 0);

    // Code
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const codeWidth = doc.getTextWidth(code);
    doc.text(code, (this.pageWidth - codeWidth) / 2, this.currentY + 15);

    // Discount value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text(`${discountValue} applied`, (this.pageWidth - doc.getTextWidth(`${discountValue} applied`)) / 2, this.currentY + 22);

    doc.setTextColor(0, 0, 0);
    return this.currentY + 30;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate complete proposal PDF with discount integration
 */
export async function generateProposalPDFWithDiscounts(
  data: ProposalPDFData,
  options: PDFDiscountOptions
): Promise<Blob> {
  const doc = new jsPDF();
  const renderer = new PDFDiscountRenderer(doc, data.brandColor);

  let currentY = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(196, 30, 58); // Brand red
  doc.text(data.companyName, 20, currentY);
  currentY += 15;

  // Proposal info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Proposal #${data.proposalNumber}`, 20, currentY);
  doc.text(`Date: ${new Date(data.createdDate).toLocaleDateString()}`, 120, currentY);
  currentY += 5;
  doc.text(`Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`, 120, currentY);
  currentY += 15;

  // Client info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Prepared For:', 20, currentY);
  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, 20, currentY);
  if (data.clientCompany) {
    currentY += 5;
    doc.text(data.clientCompany, 20, currentY);
  }
  currentY += 5;
  doc.text(data.clientEmail, 20, currentY);
  currentY += 20;

  // Services table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Services', 20, currentY);
  currentY += 10;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(20, currentY, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Service', 25, currentY + 5.5);
  doc.text('Qty', 100, currentY + 5.5);
  doc.text('Unit Price', 125, currentY + 5.5);
  doc.text('Total', 165, currentY + 5.5);
  currentY += 12;

  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  data.services.forEach((service) => {
    doc.text(service.name, 25, currentY);
    doc.text(`${service.quantity} ${service.unit}`, 100, currentY);
    doc.text(`$${service.unitPrice.toFixed(2)}`, 125, currentY);
    doc.text(`$${service.total.toFixed(2)}`, 165, currentY);
    currentY += 8;
  });

  currentY += 10;

  // Discounts section
  if (data.appliedDiscounts.length > 0) {
    currentY = renderer.renderDiscountSection(currentY, data.appliedDiscounts, data.subtotal, options);
  }

  // Pricing summary
  currentY = renderer.renderPricingSummary(currentY, {
    subtotal: data.subtotal,
    discounts: data.appliedDiscounts,
    totalDiscount: data.totalDiscount,
    discountedSubtotal: data.discountedSubtotal,
    taxRate: data.taxRate,
    taxAmount: data.taxAmount,
    total: data.total,
    depositAmount: data.depositAmount,
    balanceDue: data.balanceDue,
  });

  // Footer
  currentY = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(data.companyName, 20, currentY);
  doc.text(data.companyPhone, 20, currentY + 4);
  doc.text(data.companyEmail, 20, currentY + 8);
  if (data.companyWebsite) {
    doc.text(data.companyWebsite, 20, currentY + 12);
  }

  return doc.output('blob');
}

/**
 * Add discount watermark to existing PDF
 */
export function addDiscountWatermark(doc: jsPDF, discountText: string): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');

    // Diagonal watermark
    doc.text(discountText, 105, 150, {
      align: 'center',
      angle: 45,
    });
  }
}

export default PDFDiscountRenderer;
