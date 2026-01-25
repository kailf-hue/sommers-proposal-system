/**
 * Sommer's Proposal System - Discount Email Templates
 * Email templates for all discount-related notifications
 */

import { renderToStaticMarkup } from 'react-dom/server';

// ============================================================================
// TYPES
// ============================================================================

export interface DiscountEmailData {
  recipientName: string;
  recipientEmail: string;
  companyName?: string;
  brandColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
  supportEmail?: string;
}

export interface PromoCodeEmailData extends DiscountEmailData {
  promoCode: string;
  discountValue: string; // "10%" or "$50"
  discountDescription?: string;
  minOrderAmount?: number;
  expiresAt?: string;
  applicableServices?: string[];
  ctaUrl: string;
}

export interface LoyaltyWelcomeEmailData extends DiscountEmailData {
  tierName: string;
  currentPoints: number;
  tierBenefits: string[];
  referralCode: string;
  referralBonus: number;
}

export interface LoyaltyTierUpgradeEmailData extends DiscountEmailData {
  previousTier: string;
  newTier: string;
  newDiscount: number;
  newPerks: string[];
  totalPointsEarned: number;
}

export interface PointsEarnedEmailData extends DiscountEmailData {
  pointsEarned: number;
  totalPoints: number;
  orderAmount: number;
  proposalNumber: string;
  nextTierName?: string;
  pointsToNextTier?: number;
}

export interface SeasonalPromoEmailData extends DiscountEmailData {
  campaignName: string;
  discountValue: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  promoCode?: string;
  ctaUrl: string;
  urgencyMessage?: string;
}

export interface ApprovalRequestEmailData extends DiscountEmailData {
  requesterName: string;
  proposalNumber: string;
  proposalTotal: number;
  discountRequested: string;
  discountAmount: number;
  reason: string;
  clientName: string;
  clientLifetimeValue?: number;
  approveUrl: string;
  rejectUrl: string;
}

export interface ApprovalResultEmailData extends DiscountEmailData {
  proposalNumber: string;
  status: 'approved' | 'rejected';
  discountApproved?: string;
  reviewerName: string;
  reviewerNotes?: string;
  counterOffer?: string;
}

export interface ExpiringCodeEmailData extends DiscountEmailData {
  promoCode: string;
  discountValue: string;
  expiresAt: string;
  daysRemaining: number;
  ctaUrl: string;
}

// ============================================================================
// BASE EMAIL WRAPPER
// ============================================================================

const baseEmailStyles = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .footer { padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .button { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  .code-box { background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
  .code { font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
  .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
  .stats-grid { display: flex; gap: 16px; margin: 16px 0; }
  .stat-box { flex: 1; background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; }
  .stat-label { font-size: 12px; color: #6b7280; }
`;

function EmailWrapper({
  brandColor = '#C41E3A',
  logoUrl,
  companyName = "Sommer's Sealcoating",
  children,
  footerContent,
}: {
  brandColor?: string;
  logoUrl?: string;
  companyName?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: baseEmailStyles }} />
      </head>
      <body style={{ backgroundColor: '#f9fafb' }}>
        <div className="container">
          {/* Header */}
          <div className="header" style={{ backgroundColor: brandColor }}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ maxHeight: '50px' }} />
            ) : (
              <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>{companyName}</h1>
            )}
          </div>

          {/* Content */}
          <div className="content" style={{ backgroundColor: 'white' }}>
            {children}
          </div>

          {/* Footer */}
          <div className="footer">
            {footerContent || (
              <>
                <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
                <p>
                  <a href="#" style={{ color: '#6b7280' }}>Unsubscribe</a> ·{' '}
                  <a href="#" style={{ color: '#6b7280' }}>Privacy Policy</a>
                </p>
              </>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * New Promo Code Email
 */
export function renderPromoCodeEmail(data: PromoCodeEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0 }}>🎉 Special Discount Just For You!</h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        We're excited to share an exclusive discount code with you! Use it on your next project
        and save <strong>{data.discountValue}</strong>.
      </p>

      {/* Promo Code Box */}
      <div className="code-box">
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>YOUR PROMO CODE</div>
        <div className="code" style={{ color: data.brandColor || '#C41E3A' }}>{data.promoCode}</div>
        {data.discountDescription && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#4b5563' }}>
            {data.discountDescription}
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>Offer Details:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px' }}>
          <li>Discount: <strong>{data.discountValue}</strong></li>
          {data.minOrderAmount && data.minOrderAmount > 0 && (
            <li>Minimum order: <strong>${data.minOrderAmount}</strong></li>
          )}
          {data.expiresAt && (
            <li>Valid until: <strong>{new Date(data.expiresAt).toLocaleDateString()}</strong></li>
          )}
          {data.applicableServices && data.applicableServices.length > 0 && (
            <li>Applicable to: {data.applicableServices.join(', ')}</li>
          )}
        </ul>
      </div>

      {/* CTA Button */}
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a
          href={data.ctaUrl}
          className="button"
          style={{ backgroundColor: data.brandColor || '#C41E3A', color: 'white' }}
        >
          Request a Quote →
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Questions? Reply to this email or call us anytime.
      </p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Loyalty Program Welcome Email
 */
export function renderLoyaltyWelcomeEmail(data: LoyaltyWelcomeEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0 }}>👑 Welcome to Our Loyalty Program!</h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        Congratulations! You're now a <strong>{data.tierName}</strong> member of our loyalty program.
        Start earning points on every purchase and unlock exclusive benefits!
      </p>

      {/* Current Status */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
        borderRadius: '12px', 
        padding: '24px', 
        color: 'white',
        textAlign: 'center',
        margin: '24px 0'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>YOUR CURRENT STATUS</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>{data.tierName}</div>
        <div style={{ fontSize: '18px' }}>{data.currentPoints.toLocaleString()} points</div>
      </div>

      {/* Benefits */}
      <h3>Your {data.tierName} Benefits:</h3>
      <ul style={{ paddingLeft: '20px' }}>
        {data.tierBenefits.map((benefit, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>{benefit}</li>
        ))}
      </ul>

      {/* Referral Code */}
      <div className="code-box">
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>YOUR REFERRAL CODE</div>
        <div className="code" style={{ color: data.brandColor || '#C41E3A' }}>{data.referralCode}</div>
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#4b5563' }}>
          Share this code and earn <strong>{data.referralBonus} bonus points</strong> for each referral!
        </div>
      </div>

      <p>Start earning today - every dollar spent earns you points toward your next reward!</p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Loyalty Tier Upgrade Email
 */
export function renderTierUpgradeEmail(data: LoyaltyTierUpgradeEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0 }}>🎊 You've Been Upgraded to {data.newTier}!</h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        Great news! Your loyalty has paid off. You've earned enough points to reach our
        <strong> {data.newTier}</strong> tier!
      </p>

      {/* Upgrade Visual */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <span style={{ 
          display: 'inline-block', 
          padding: '8px 16px', 
          background: '#e5e7eb', 
          borderRadius: '20px',
          color: '#6b7280'
        }}>
          {data.previousTier}
        </span>
        <span style={{ margin: '0 16px', fontSize: '24px' }}>→</span>
        <span style={{ 
          display: 'inline-block', 
          padding: '8px 16px', 
          background: data.brandColor || '#C41E3A', 
          borderRadius: '20px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {data.newTier}
        </span>
      </div>

      {/* New Benefits */}
      <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>✨ Your New Benefits:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534' }}>
          <li><strong>{data.newDiscount}% discount</strong> on all services</li>
          {data.newPerks.map((perk, index) => (
            <li key={index}>{perk}</li>
          ))}
        </ul>
      </div>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        Total points earned: <strong>{data.totalPointsEarned.toLocaleString()}</strong>
      </p>

      <p>Thank you for being a valued customer!</p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Points Earned Email
 */
export function renderPointsEarnedEmail(data: PointsEarnedEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0 }}>⭐ You Earned {data.pointsEarned} Points!</h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        Thank you for your recent order! You've earned <strong>{data.pointsEarned} points</strong> from
        proposal #{data.proposalNumber}.
      </p>

      {/* Points Summary */}
      <div className="stats-grid" style={{ display: 'flex', gap: '16px', margin: '24px 0' }}>
        <div className="stat-box" style={{ flex: 1, background: '#f9fafb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            +{data.pointsEarned}
          </div>
          <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Points Earned</div>
        </div>
        <div className="stat-box" style={{ flex: 1, background: '#f9fafb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: data.brandColor || '#C41E3A' }}>
            {data.totalPoints.toLocaleString()}
          </div>
          <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Total Balance</div>
        </div>
      </div>

      {/* Next Tier Progress */}
      {data.nextTierName && data.pointsToNextTier && (
        <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            <strong>{data.pointsToNextTier.toLocaleString()}</strong> more points to reach{' '}
            <strong>{data.nextTierName}</strong>!
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div style={{ 
              background: data.brandColor || '#C41E3A', 
              height: '100%', 
              width: `${Math.min(100, (data.totalPoints / (data.totalPoints + data.pointsToNextTier)) * 100)}%` 
            }} />
          </div>
        </div>
      )}

      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Order amount: ${data.orderAmount.toFixed(2)}
      </p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Seasonal Promotion Email
 */
export function renderSeasonalPromoEmail(data: SeasonalPromoEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      {/* Banner Image */}
      {data.bannerImageUrl && (
        <img 
          src={data.bannerImageUrl} 
          alt={data.campaignName}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '24px' }}
        />
      )}

      <h2 style={{ marginTop: 0, color: data.brandColor || '#C41E3A' }}>
        🌟 {data.campaignName}
      </h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p style={{ fontSize: '18px' }}>
        For a limited time, enjoy <strong style={{ color: data.brandColor || '#C41E3A' }}>{data.discountValue}</strong> off
        your next project!
      </p>

      {/* Urgency Message */}
      {data.urgencyMessage && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px', 
          padding: '12px 16px',
          color: '#991b1b',
          fontWeight: '500',
          textAlign: 'center',
          margin: '16px 0'
        }}>
          ⏰ {data.urgencyMessage}
        </div>
      )}

      {/* Promo Code */}
      {data.promoCode && (
        <div className="code-box">
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>USE CODE</div>
          <div className="code" style={{ color: data.brandColor || '#C41E3A' }}>{data.promoCode}</div>
        </div>
      )}

      {/* Dates */}
      <p style={{ textAlign: 'center', color: '#6b7280' }}>
        Valid: {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
      </p>

      {/* CTA */}
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a
          href={data.ctaUrl}
          className="button"
          style={{ backgroundColor: data.brandColor || '#C41E3A', color: 'white' }}
        >
          Claim Your Discount →
        </a>
      </div>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Discount Approval Request Email (to manager)
 */
export function renderApprovalRequestEmail(data: ApprovalRequestEmailData): string {
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0 }}>🔔 Discount Approval Needed</h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        <strong>{data.requesterName}</strong> has requested approval for a discount on
        proposal <strong>#{data.proposalNumber}</strong>.
      </p>

      {/* Request Details */}
      <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <table style={{ width: '100%', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Client:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' }}>{data.clientName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Proposal Total:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' }}>${data.proposalTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Discount Requested:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right', color: '#dc2626' }}>{data.discountRequested}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Amount:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right', color: '#dc2626' }}>-${data.discountAmount.toFixed(2)}</td>
            </tr>
            {data.clientLifetimeValue && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Client LTV:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' }}>${data.clientLifetimeValue.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reason */}
      <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>REASON:</div>
        <div style={{ fontStyle: 'italic' }}>"{data.reason}"</div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', margin: '24px 0' }}>
        <a
          href={data.approveUrl}
          style={{ 
            flex: 1, 
            display: 'block', 
            padding: '14px', 
            backgroundColor: '#22c55e', 
            color: 'white', 
            textAlign: 'center', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          ✓ Approve
        </a>
        <a
          href={data.rejectUrl}
          style={{ 
            flex: 1, 
            display: 'block', 
            padding: '14px', 
            backgroundColor: '#ef4444', 
            color: 'white', 
            textAlign: 'center', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          ✕ Reject
        </a>
      </div>

      <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
        Or log in to the dashboard to review with more options.
      </p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Approval Result Email (to requester)
 */
export function renderApprovalResultEmail(data: ApprovalResultEmailData): string {
  const isApproved = data.status === 'approved';
  
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0, color: isApproved ? '#22c55e' : '#ef4444' }}>
        {isApproved ? '✓ Discount Approved!' : '✕ Discount Request Declined'}
      </h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        Your discount request for proposal <strong>#{data.proposalNumber}</strong> has been
        <strong style={{ color: isApproved ? '#22c55e' : '#ef4444' }}>
          {isApproved ? ' approved' : ' declined'}
        </strong>
        by {data.reviewerName}.
      </p>

      {isApproved && data.discountApproved && (
        <div style={{ 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '8px', 
          padding: '16px',
          textAlign: 'center',
          margin: '16px 0'
        }}>
          <div style={{ fontSize: '14px', color: '#166534' }}>APPROVED DISCOUNT</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', marginTop: '8px' }}>
            {data.discountApproved}
          </div>
        </div>
      )}

      {data.counterOffer && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #fde68a', 
          borderRadius: '8px', 
          padding: '16px',
          margin: '16px 0'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>Counter Offer:</div>
          <div style={{ color: '#92400e', marginTop: '8px' }}>{data.counterOffer}</div>
        </div>
      )}

      {data.reviewerNotes && (
        <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>REVIEWER NOTES:</div>
          <div style={{ fontStyle: 'italic' }}>"{data.reviewerNotes}"</div>
        </div>
      )}

      <p>
        {isApproved 
          ? 'You can now proceed with sending the proposal to the client.'
          : 'Please adjust the proposal or contact your manager if you have questions.'}
      </p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

/**
 * Expiring Promo Code Reminder Email
 */
export function renderExpiringCodeEmail(data: ExpiringCodeEmailData): string {
  const urgencyColor = data.daysRemaining <= 1 ? '#dc2626' : data.daysRemaining <= 3 ? '#f59e0b' : '#6b7280';
  
  const content = (
    <EmailWrapper brandColor={data.brandColor} logoUrl={data.logoUrl} companyName={data.companyName}>
      <h2 style={{ marginTop: 0, color: urgencyColor }}>
        ⏰ Your Discount Expires {data.daysRemaining <= 1 ? 'Tomorrow!' : `in ${data.daysRemaining} Days!`}
      </h2>
      
      <p>Hi {data.recipientName},</p>
      
      <p>
        Don't miss out! Your <strong>{data.discountValue}</strong> discount code expires on
        <strong> {new Date(data.expiresAt).toLocaleDateString()}</strong>.
      </p>

      {/* Countdown Visual */}
      <div style={{ 
        background: `linear-gradient(135deg, ${urgencyColor}20 0%, ${urgencyColor}10 100%)`, 
        borderRadius: '12px', 
        padding: '24px', 
        textAlign: 'center',
        margin: '24px 0',
        border: `2px solid ${urgencyColor}40`
      }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: urgencyColor }}>
          {data.daysRemaining}
        </div>
        <div style={{ fontSize: '14px', color: urgencyColor, textTransform: 'uppercase' }}>
          Days Remaining
        </div>
      </div>

      {/* Code Box */}
      <div className="code-box">
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>YOUR CODE</div>
        <div className="code" style={{ color: data.brandColor || '#C41E3A' }}>{data.promoCode}</div>
        <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
          {data.discountValue} OFF
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a
          href={data.ctaUrl}
          className="button"
          style={{ backgroundColor: urgencyColor, color: 'white' }}
        >
          Use My Discount Now →
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
        This offer cannot be extended. Use it before it's gone!
      </p>
    </EmailWrapper>
  );

  return renderToStaticMarkup(content);
}

// ============================================================================
// EMAIL SERVICE INTEGRATION
// ============================================================================

export interface SendDiscountEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendDiscountEmail(params: SendDiscountEmailParams): Promise<void> {
  // This would integrate with your email service (Resend, SendGrid, etc.)
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function sendPromoCodeEmail(data: PromoCodeEmailData) {
  const html = renderPromoCodeEmail(data);
  await sendDiscountEmail({
    to: data.recipientEmail,
    subject: `🎉 Your Exclusive ${data.discountValue} Discount Code!`,
    html,
  });
}

export async function sendLoyaltyWelcomeEmail(data: LoyaltyWelcomeEmailData) {
  const html = renderLoyaltyWelcomeEmail(data);
  await sendDiscountEmail({
    to: data.recipientEmail,
    subject: `👑 Welcome to ${data.tierName} - Loyalty Program`,
    html,
  });
}

export async function sendTierUpgradeEmail(data: LoyaltyTierUpgradeEmailData) {
  const html = renderTierUpgradeEmail(data);
  await sendDiscountEmail({
    to: data.recipientEmail,
    subject: `🎊 Congratulations! You've reached ${data.newTier}!`,
    html,
  });
}

export async function sendApprovalRequestEmail(data: ApprovalRequestEmailData) {
  const html = renderApprovalRequestEmail(data);
  await sendDiscountEmail({
    to: data.recipientEmail,
    subject: `🔔 Discount Approval Needed: ${data.proposalNumber}`,
    html,
  });
}

export async function sendExpiringCodeEmail(data: ExpiringCodeEmailData) {
  const html = renderExpiringCodeEmail(data);
  const urgency = data.daysRemaining <= 1 ? '⚠️ LAST DAY:' : '⏰';
  await sendDiscountEmail({
    to: data.recipientEmail,
    subject: `${urgency} Your ${data.discountValue} discount expires soon!`,
    html,
  });
}

export default {
  renderPromoCodeEmail,
  renderLoyaltyWelcomeEmail,
  renderTierUpgradeEmail,
  renderPointsEarnedEmail,
  renderSeasonalPromoEmail,
  renderApprovalRequestEmail,
  renderApprovalResultEmail,
  renderExpiringCodeEmail,
  sendPromoCodeEmail,
  sendLoyaltyWelcomeEmail,
  sendTierUpgradeEmail,
  sendApprovalRequestEmail,
  sendExpiringCodeEmail,
};
