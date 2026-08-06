class TCheckInfo < ActiveRecord::Base
	has_many :t_chktrackrec
	has_many :t_repair_info, :through => :t_chktrackrec
	belongs_to :t_housinginfo
	belongs_to :m_kind
end
