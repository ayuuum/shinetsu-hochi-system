class TChktrackrecInfo < ActiveRecord::Base
	has_one :t_repair_info
	belongs_to :t_check_info

end
